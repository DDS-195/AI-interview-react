// 离线显式建立索引，在线先按范围取候选再语义排序，缺资料时保留常规出题。
const { knowledgeConfig } = require('./config')
const { createLocalEmbedding } = require('./localEmbedding')
const { cosine } = require('./similarity')
const { document, search, hash, fail } = require('./validation')

function createKnowledgeService(repository, options = {}) {
  const config = options.config || knowledgeConfig()
  const embedding = options.embedding || createLocalEmbedding(config)
  async function status() {
    return {
      ...(await repository.indexStatus(config.profileKey)),
      mode: config.mode,
      model: config.model,
      dimension: config.dimension
    }
  }
  // 脚本显式调用：取未完成的切片，生成向量，存回MySQL。失败后下次执行自然续跑。
  async function indexOnce(signal) {
    const chunks = await repository.pendingChunks(config.profileKey)
    if (!chunks.length) {
      return { processed: 0 }
    }
    await embedding.prepare?.(signal)
    const vectors = await embedding.embed(
      chunks.map((chunk) => chunk.headingPath + '\n' + chunk.text),
      signal,
      'passage'
    )
    if (
      !Array.isArray(vectors) ||
      vectors.length !== chunks.length ||
      vectors.some(
        (vector) =>
          !Array.isArray(vector) ||
          vector.length !== config.dimension ||
          vector.some((v) => !Number.isFinite(v)) ||
          !vector.some((v) => v !== 0)
      )
    ) {
      fail('本地模型返回的向量无效', 502)
    }
    signal?.throwIfAborted()
    await repository.putVectors(chunks, vectors, config.profileKey)
    return { processed: chunks.length }
  }
  // 数据库范围过滤在前、向量排序在后；用户取消必须抛出，不能伪装成常规回退。
  async function retrieve(rawScope, { signal } = {}) {
    const scope = search(rawScope)
    signal?.throwIfAborted()
    const snapshot = {
      status: 'unavailable',
      method: 'semantic',
      retrievedAt: new Date().toISOString(),
      indexProfile: config.profileKey,
      retrievalVersion: 'retrieval-simple-v2',
      evidence: []
    }
    const candidates = await repository.candidates(scope)
    signal?.throwIfAborted()
    const indexed = candidates.filter(
      (chunk) => chunk.embedding && chunk.embeddingProfile === config.profileKey
    )
    if (!indexed.length) {
      return {
        ...snapshot,
        reason: candidates.length
          ? '当前资料尚未生成向量，使用常规出题'
          : '当前知识点暂无资料，使用常规出题'
      }
    }
    try {
      const deadline = AbortSignal.timeout(8000)
      const [vector] = await embedding.embed(
        [scope.query],
        signal ? AbortSignal.any([signal, deadline]) : deadline
      )
      // 相似度只用于过滤和排序，不表示资料必然支持题目或评分结论。
      const hits = indexed
        .map((chunk) => ({ chunk, score: cosine(vector, chunk.embedding) }))
        .filter((hit) => hit.score >= 0.45)
        .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
      const evidence = []
      const perDocument = new Map()
      let length = 0
      for (const { chunk } of hits) {
        if ((perDocument.get(chunk.documentId) || 0) >= 2 || length + chunk.text.length > 9000) {
          continue
        }
        evidence.push(toEvidence(chunk))
        length += chunk.text.length
        perDocument.set(chunk.documentId, (perDocument.get(chunk.documentId) || 0) + 1)
        if (evidence.length === 5) {
          break
        }
      }
      return evidence.length
        ? { ...snapshot, status: 'grounded', evidence }
        : { ...snapshot, reason: '未检索到足够相关的资料，使用常规出题' }
    } catch (error) {
      if (signal?.aborted) {
        throw signal.reason || error
      }
      return { ...snapshot, reason: '本地向量检索暂不可用，使用常规出题' }
    }
  }
  return {
    config,
    repository,
    status,
    indexOnce,
    retrieve,
    importDocument: (value) => repository.importDocument(document(value)),
    close: () => embedding.close?.()
  }
}
function toEvidence(chunk) {
  return {
    id: chunk.id,
    documentId: chunk.documentId,
    documentVersionId: chunk.documentVersionId,
    revision: Number(chunk.revision),
    title: chunk.title,
    url: chunk.sourceUrl,
    heading: chunk.headingPath,
    text: chunk.text,
    technicalVersion: chunk.metadata.technicalVersion,
    contentHash: hash(chunk.text),
    kind: chunk.metadata.kind
  }
}
module.exports = { createKnowledgeService, toEvidence }
