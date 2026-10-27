// 两张知识表保存原文和当前切片，更新使旧向量失效，历史题目保留独立快照。
const { randomUUID } = require('node:crypto')
const { splitDocument } = require('./chunker')
const { fail } = require('./validation')
const json = (value) => (typeof value === 'string' ? JSON.parse(value) : value)
const query = async (connection, sql, values = []) => (await connection.execute(sql, values))[0]
const unpack = (row) => ({
  ...row,
  metadata: json(row.metadata),
  ...(row.embedding ? { embedding: json(row.embedding) } : {})
})

// 两张表：文档保存原文，切片保存正文和向量。历史评分依据独立保存在题目快照中。
module.exports = function createKnowledgeRepository({ pool, run, atomic }) {
  return {
    // 同来源内容不变时幂等返回；内容变化则替换当前切片，使旧向量失效。
    importDocument: atomic(async (connection, document) => {
      // 锁定来源，重复导入不改写切片；内容变化时一次事务替换文档与全部切片。
      await query(
        connection,
        `INSERT INTO rag_documents
        (id,sourceKey,title,sourceUrl,sourceKind,rawText,metadata,contentHash,versionId,revision,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,1,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE sourceKey=sourceKey`,
        [
          randomUUID(),
          document.sourceKey,
          document.title,
          document.sourceUrl,
          document.sourceKind,
          document.content,
          JSON.stringify(document.metadata),
          document.contentHash,
          randomUUID()
        ]
      )
      const [saved] = await query(
        connection,
        'SELECT * FROM rag_documents WHERE sourceKey=? FOR UPDATE',
        [document.sourceKey]
      )
      const [{ count }] = await query(
        connection,
        'SELECT COUNT(*) AS count FROM rag_chunks WHERE documentId=?',
        [saved.id]
      )
      if (saved.contentHash === document.contentHash && count > 0) {
        return {
          documentId: saved.id,
          versionId: saved.versionId,
          revision: saved.revision,
          duplicate: true
        }
      }
      const changed = saved.contentHash !== document.contentHash
      const revision = Number(saved.revision) + Number(changed)
      const versionId = changed ? randomUUID() : saved.versionId
      const chunks = splitDocument(document.content, document.title)
      await query(
        connection,
        `UPDATE rag_documents SET title=?,sourceUrl=?,sourceKind=?,rawText=?,metadata=?,
        contentHash=?,versionId=?,revision=?,updatedAt=UTC_TIMESTAMP(3) WHERE id=?`,
        [
          document.title,
          document.sourceUrl,
          document.sourceKind,
          document.content,
          JSON.stringify(document.metadata),
          document.contentHash,
          versionId,
          revision,
          saved.id
        ]
      )
      await query(connection, 'DELETE FROM rag_chunks WHERE documentId=?', [saved.id])
      for (const chunk of chunks) {
        await query(
          connection,
          'INSERT INTO rag_chunks (id,documentId,sequence,headingPath,text,contentHash) VALUES (?,?,?,?,?,?)',
          [randomUUID(), saved.id, chunk.sequence, chunk.headingPath, chunk.text, chunk.contentHash]
        )
      }
      return { documentId: saved.id, versionId, revision, duplicate: false }
    }),
    list: run(async () =>
      (
        await query(
          pool,
          `SELECT d.id,d.title,d.sourceUrl,d.metadata,(SELECT COUNT(*) FROM rag_chunks c WHERE c.documentId=d.id) AS chunks
      FROM rag_documents d ORDER BY d.title,d.id`
        )
      ).map((row) => {
        const metadata = json(row.metadata)
        return {
          id: row.id,
          title: row.title,
          sourceUrl: row.sourceUrl,
          technicalVersion: metadata.technicalVersion,
          categoryId: metadata.categoryId,
          topicIds: metadata.topicIds,
          chunks: Number(row.chunks)
        }
      })
    ),
    detail: run(async (id) => {
      const [row] = await query(pool, 'SELECT * FROM rag_documents WHERE id=?', [id])
      if (!row) {
        fail('知识文档不存在', 404)
      }
      return {
        title: row.title,
        sourceUrl: row.sourceUrl,
        rawText: row.rawText,
        metadata: json(row.metadata)
      }
    }),
    exportData: run(async () => ({
      format: 'knowledge-simple-v1',
      documents: (await query(pool, 'SELECT * FROM rag_documents ORDER BY id')).map(unpack)
    })),
    // 先限定分类、考点、版本和题型；容量上限按本次范围计算，不是整个知识库。
    candidates: run(async (scope) => {
      const conditions = [
        "JSON_UNQUOTE(JSON_EXTRACT(d.metadata,'$.categoryId'))=?",
        "JSON_CONTAINS(JSON_EXTRACT(d.metadata,'$.topicIds'),JSON_QUOTE(?))"
      ]
      const values = [scope.categoryId, scope.topicId]
      if (scope.technicalVersion) {
        conditions.push("JSON_UNQUOTE(JSON_EXTRACT(d.metadata,'$.technicalVersion'))=?")
        values.push(scope.technicalVersion)
      }
      if (scope.mode) {
        conditions.push("JSON_CONTAINS(JSON_EXTRACT(d.metadata,'$.modes'),JSON_QUOTE(?))")
        values.push(scope.mode)
      }
      const rows = await query(
        pool,
        `SELECT c.*,d.versionId AS documentVersionId,d.revision,d.title,d.sourceUrl,d.metadata
        FROM rag_chunks c JOIN rag_documents d ON d.id=c.documentId WHERE ${conditions.join(' AND ')} ORDER BY c.id LIMIT 1001`,
        values
      )
      if (rows.length > 1000) {
        fail('当前知识点超过本地检索容量，请拆分知识点', 503)
      }
      return rows.map(unpack)
    }),
    pendingChunks: run(async (profile) =>
      query(
        pool,
        `SELECT id,headingPath,text,contentHash FROM rag_chunks
      WHERE embedding IS NULL OR embeddingProfile IS NULL OR embeddingProfile<>? ORDER BY documentId,sequence LIMIT 4`,
        [profile]
      )
    ),
    // 更新时同时匹配切片 ID 与内容 hash，旧计算不能覆盖已修改的片段。
    putVectors: atomic(async (connection, chunks, vectors, profile) => {
      for (let i = 0; i < chunks.length; i++) {
        await query(
          connection,
          'UPDATE rag_chunks SET embedding=?,embeddingProfile=? WHERE id=? AND contentHash=?',
          [JSON.stringify(vectors[i]), profile, chunks[i].id, chunks[i].contentHash]
        )
      }
    }),
    indexStatus: run(async (profile) => {
      const [{ documents }] = await query(pool, 'SELECT COUNT(*) AS documents FROM rag_documents')
      const [{ total, indexed }] = await query(
        pool,
        'SELECT COUNT(*) AS total,COALESCE(SUM(embedding IS NOT NULL AND embeddingProfile=?),0) AS indexed FROM rag_chunks',
        [profile]
      )
      return {
        documents: Number(documents),
        total: Number(total),
        indexed: Number(indexed),
        pending: Number(total) - Number(indexed),
        ready: Number(total) > 0 && Number(total) === Number(indexed)
      }
    })
  }
}
