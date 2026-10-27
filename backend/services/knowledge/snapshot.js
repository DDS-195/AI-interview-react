// 验证知识快照内容和来源绑定；引用属于允许片段不代表结论获得语义验证。
const { text } = require('../dataValidation')
const { hash, fail } = require('./validation')
function validateSnapshot(value) {
  if (
    !value ||
    !['grounded', 'unavailable'].includes(value.status) ||
    !['keyword', 'hybrid', 'semantic'].includes(value.method) ||
    !Array.isArray(value.evidence) ||
    value.evidence.length > 5
  ) {
    fail('知识依据格式无效')
  }
  const retrievedAt = text(value.retrievedAt, '检索时间', 100)
  if (!Number.isFinite(Date.parse(retrievedAt))) {
    fail('检索时间无效')
  }
  const evidence = value.evidence.map((item) => {
    if (!item || !Number.isSafeInteger(item.revision) || item.revision < 1) {
      fail('知识版本无效')
    }
    const body = text(item.text, '知识片段', 6000)
    if (item.contentHash !== hash(body)) {
      fail('知识依据内容校验失败')
    }
    const url = text(item.url, '知识来源', 1000)
    try {
      if (new URL(url).protocol !== 'https:') {
        fail('知识来源无效')
      }
    } catch {
      fail('知识来源无效')
    }
    return {
      id: text(item.id, '切片编号', 36),
      documentId: text(item.documentId, '文档编号', 36),
      documentVersionId: text(item.documentVersionId, '版本编号', 36),
      revision: item.revision,
      title: text(item.title, '知识标题', 200),
      heading: text(item.heading, '知识章节', 500),
      url,
      text: body,
      technicalVersion: text(item.technicalVersion, '技术版本', 200),
      contentHash: item.contentHash,
      kind: text(item.kind, '知识类型', 40)
    }
  })
  if (
    new Set(evidence.map((item) => item.id)).size !== evidence.length ||
    (value.status === 'grounded') !== Boolean(evidence.length)
  ) {
    fail('知识依据状态不匹配')
  }
  if (value.indexProfile !== null && !/^[a-f0-9]{64}$/.test(value.indexProfile)) {
    fail('索引版本无效')
  }
  return {
    status: value.status,
    method: value.method,
    retrievedAt,
    evidence,
    indexProfile: value.indexProfile,
    retrievalVersion: text(value.retrievalVersion, '检索版本', 100),
    ...(value.reason ? { reason: text(value.reason, '检索说明', 300) } : {})
  }
}

// 校验评分项只能引用本题提供的切片；不验证技术断言是否被片段支持。
function validateBindings(value, ids, snapshot) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== ids.length
  ) {
    fail('评分知识依据不完整')
  }
  const available = new Set(snapshot.evidence.map((item) => item.id))
  return Object.fromEntries(
    ids.map((id) => {
      const sources = value[id]
      if (
        !Array.isArray(sources) ||
        !sources.length ||
        sources.length > 3 ||
        sources.some((source) => !available.has(source))
      ) {
        fail('评分引用了未检索到的知识依据')
      }
      return [id, [...new Set(sources)]]
    })
  )
}
module.exports = { validateSnapshot, validateBindings }
