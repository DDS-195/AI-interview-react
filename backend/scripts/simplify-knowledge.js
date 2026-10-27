// 旧知识架构的一次性迁移工具，先备份和核对，再清理旧知识表。
require('dotenv').config({ path: __dirname + '/../.env', quiet: true })
const fs = require('node:fs/promises')
const path = require('node:path')
const mysql = require('mysql2/promise')
const { createDataStore } = require('../services/dataStore')
const { connectionConfig, mysqlConfig } = require('../database/config')
const { knowledgeConfig } = require('../services/knowledge/config')
const { document, hash } = require('../services/knowledge/validation')
const { readKnowledge, formatMarkdown, DIRECTORY } = require('../services/knowledge/markdown')
const LEGACY_TABLES = [
  'knowledge_vectors',
  'knowledge_index_entries',
  'knowledge_index_builds',
  'knowledge_chunk_topics',
  'knowledge_chunks',
  'knowledge_document_versions',
  'knowledge_documents'
]
const json = (value) => (typeof value === 'string' ? JSON.parse(value) : value)

// 一次性升级工具；日常运行不加载这段兼容逻辑。先备份、搬迁和核对，再删除旧知识表。
async function migrateLegacyKnowledge(
  store,
  connection,
  { sourceDirectory = DIRECTORY, backupDirectory = path.join(__dirname, '../.cache/backups') } = {}
) {
  const [found] = await connection.query('SHOW TABLES')
  const tables = found.map((row) => Object.values(row)[0])
  if (!LEGACY_TABLES.some((table) => tables.includes(table))) {
    return { migrated: false }
  }
  if (!LEGACY_TABLES.every((table) => tables.includes(table))) {
    throw new Error('旧知识表不完整，保留现状，请检查此前迁移备份')
  }
  const before = await store.exportData()
  const legacy = {}
  for (const table of LEGACY_TABLES) {
    legacy[table] = (await connection.query('SELECT * FROM ' + mysql.escapeId(table)))[0]
  }
  const backup = JSON.stringify(
    { format: 'legacy-rag-backup-v1', training: before, tables: legacy },
    null,
    2
  )
  await fs.mkdir(backupDirectory, { recursive: true })
  const backupFile = path.join(backupDirectory, 'rag-before-simplification-' + Date.now() + '.json')
  await fs.writeFile(backupFile, backup, { flag: 'wx' })
  if (hash(await fs.readFile(backupFile, 'utf8')) !== hash(backup)) {
    throw new Error('迁移备份校验失败')
  }

  const notes = await readKnowledge(sourceDirectory)
  const known = new Map(notes.map((note) => [document(note).sourceKey, note]))
  const config = knowledgeConfig({ RAG_MODE: 'prefer' })
  const build = legacy.knowledge_index_builds.find((row) => row.profileKey === config.profileKey)
  const active = legacy.knowledge_documents.filter((row) => row.status === 'active')
  const records = []
  for (const row of active) {
    const version = legacy.knowledge_document_versions.find(
      (item) => item.id === row.activeVersionId && item.reviewStatus === 'approved'
    )
    if (!version) {
      throw new Error('旧启用资料缺少已审核版本，保留原表')
    }
    const metadata = json(version.metadata)
    // 资料以旧库当前正文为准；自定义资料也写回Markdown，避免只存在数据库中。
    const note = {
      ...metadata,
      title: metadata.title || row.title,
      sourceUrl: metadata.sourceUrl || row.sourceUrl,
      sourceKind: metadata.sourceKind || row.sourceKind,
      content: version.rawText,
      sourceKey: known.has(row.sourceKey)
        ? known.get(row.sourceKey).sourceKey
        : 'legacy:' + row.sourceKey
    }
    const normalized = document(note)
    const folder = path.join(sourceDirectory, 'imported')
    // 同来源文件已存在且正文不同，保留两份到备份中，导出旧库当前正文供后续导入。
    const original = known.get(row.sourceKey)
    if (original && document(original).contentHash !== normalized.contentHash) {
      throw new Error('Markdown与数据库当前资料不同，请先对齐后迁移：' + row.title)
    }
    if (!original) {
      await fs.mkdir(folder, { recursive: true })
      await fs.writeFile(
        path.join(folder, 'legacy-' + row.id + '.md'),
        formatMarkdown(note),
        'utf8'
      )
    }
    records.push({ row, version, normalized })
  }

  await connection.beginTransaction()
  try {
    const database = connection
    for (const { row, version, normalized: value } of records) {
      const [existing] = await database.execute(
        'SELECT id,contentHash FROM rag_documents WHERE sourceKey=?',
        [value.sourceKey]
      )
      if (existing.length) {
        throw new Error('新知识库已有同来源资料，请先处理重复数据，旧表保持不变')
      }
      await database.execute(
        `INSERT INTO rag_documents
        (id,sourceKey,title,sourceUrl,sourceKind,rawText,metadata,contentHash,versionId,revision,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3))`,
        [
          row.id,
          value.sourceKey,
          value.title,
          value.sourceUrl,
          value.sourceKind,
          value.content,
          JSON.stringify(value.metadata),
          value.contentHash,
          version.id,
          version.revision
        ]
      )
      for (const chunk of legacy.knowledge_chunks.filter(
        (item) => item.documentVersionId === version.id
      )) {
        const savedVector =
          build &&
          legacy.knowledge_vectors.find(
            (item) => item.buildId === build.id && item.chunkId === chunk.id
          )
        const vector = savedVector ? json(savedVector.vector) : null
        const valid =
          Array.isArray(vector) &&
          vector.length === 384 &&
          vector.every(Number.isFinite) &&
          vector.some((v) => v !== 0)
        await database.execute(
          `INSERT INTO rag_chunks
          (id,documentId,sequence,headingPath,text,contentHash,embedding,embeddingProfile) VALUES (?,?,?,?,?,?,?,?)`,
          [
            chunk.id,
            row.id,
            chunk.sequence,
            chunk.headingPath,
            chunk.text,
            chunk.contentHash,
            valid ? JSON.stringify(vector) : null,
            valid ? config.profileKey : null
          ]
        )
      }
    }
    const [saved] = await database.query('SELECT id,rawText FROM rag_documents')
    for (const { row, version } of records) {
      if (
        !saved.some(
          (item) =>
            item.id === row.id && item.rawText === version.rawText.trim().replace(/\r\n/g, '\n')
        )
      ) {
        throw new Error('知识原文核对失败，回滚迁移')
      }
    }
    if (hash(JSON.stringify(before)) !== hash(JSON.stringify(await store.exportData()))) {
      throw new Error('训练数据发生变化，停止清理')
    }
    const [savedChunks] = await database.query(
      'SELECT id,text,contentHash,embedding FROM rag_chunks'
    )
    const migratedChunks = legacy.knowledge_chunks.filter((chunk) =>
      records.some((item) => item.version.id === chunk.documentVersionId)
    )
    for (const chunk of migratedChunks) {
      if (
        !savedChunks.some(
          (item) =>
            item.id === chunk.id &&
            item.text === chunk.text &&
            item.contentHash === chunk.contentHash
        )
      ) {
        throw new Error('知识切片核对失败，回滚迁移')
      }
    }
    for (const chunk of migratedChunks) {
      const saved =
        build &&
        legacy.knowledge_vectors.find(
          (item) => item.buildId === build.id && item.chunkId === chunk.id
        )
      const vector = saved ? json(saved.vector) : null
      if (
        Array.isArray(vector) &&
        vector.length === 384 &&
        vector.every(Number.isFinite) &&
        vector.some((v) => v !== 0)
      ) {
        const current = savedChunks.find((item) => item.id === chunk.id)
        if (JSON.stringify(json(current.embedding)) !== JSON.stringify(vector)) {
          throw new Error('知识向量核对失败，回滚迁移')
        }
      }
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  }
  // 迁移事务已提交且磁盘备份已核对，按外键依赖顺序清理旧表。
  for (const table of LEGACY_TABLES) {
    await connection.query('DROP TABLE ' + mysql.escapeId(table))
  }
  await connection.execute("DELETE FROM metadata WHERE name='active_knowledge_index'")
  return { migrated: true, documents: records.length, trainingDataUnchanged: true, backupFile }
}
async function main() {
  const store = createDataStore()
  const connection = await mysql.createConnection(connectionConfig(mysqlConfig()))
  try {
    await store.summary()
    console.log(JSON.stringify(await migrateLegacyKnowledge(store, connection), null, 2))
  } finally {
    await connection.end()
    await store.close()
  }
}
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
module.exports = { migrateLegacyKnowledge }
