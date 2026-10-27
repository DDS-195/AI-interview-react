const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const mysql = require('mysql2/promise')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { connectionConfig } = require('../database/config')
const { migrateLegacyKnowledge } = require('../scripts/simplify-knowledge')
const { document, hash } = require('../services/knowledge/validation')
const { knowledgeConfig } = require('../services/knowledge/config')
const { readKnowledge, formatMarkdown } = require('../services/knowledge/markdown')
const { createKnowledgeService } = require('../services/knowledge/service')

test('迁移先备份旧知识，保留当前原文、向量和训练记录，最终只保留两张知识表', async () => {
  const database = await createTemporaryDatabase()
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rag-migration-test-'))
  const connection = await mysql.createConnection(connectionConfig(database.config))
  try {
    await database.store.putQuestion({
      id: 'old-q',
      categoryId: 'react',
      title: '已有题目',
      content: '说明状态更新',
      difficulty: 'medium',
      type: 'text'
    })
    await database.store.addHistory({
      questionId: 'old-q',
      answer: '已有回答',
      submittedAt: '2026-10-12T00:00:00.000Z',
      score: 0,
      feedback: '反馈'
    })
    const before = await database.store.exportData()
    const definitions = {
      knowledge_documents:
        'id VARCHAR(36),sourceKey VARCHAR(64),title TEXT,sourceUrl TEXT,sourceKind TEXT,status TEXT,activeVersionId VARCHAR(36)',
      knowledge_document_versions:
        'id VARCHAR(36),documentId VARCHAR(36),revision INT,metadata JSON,rawText TEXT,reviewStatus TEXT',
      knowledge_chunks:
        'id VARCHAR(36),documentVersionId VARCHAR(36),sequence INT,headingPath TEXT,text TEXT,contentHash VARCHAR(64)',
      knowledge_chunk_topics: 'chunkId VARCHAR(36)',
      knowledge_index_builds: 'id VARCHAR(36),profileKey VARCHAR(64)',
      knowledge_index_entries: 'chunkId VARCHAR(36)',
      knowledge_vectors: 'buildId VARCHAR(36),chunkId VARCHAR(36),vector JSON'
    }
    for (const [table, columns] of Object.entries(definitions)) {
      await connection.query('CREATE TABLE ' + mysql.escapeId(table) + ' (' + columns + ')')
    }
    const note = {
      title: '旧知识笔记',
      sourceUrl: 'https://react.dev/reference/react/useEffect',
      categoryId: 'react',
      topicIds: ['react:effects'],
      technicalVersion: 'React 18，函数组件与Hooks',
      kind: 'concept',
      content: '卸载时清理副作用。'
    }
    const value = document(note)
    const config = knowledgeConfig({ RAG_MODE: 'prefer' })
    const vector = [1, ...Array(383).fill(0)]
    await connection.execute(
      "INSERT INTO knowledge_documents VALUES ('doc',?,?,?,'curated','active','version')",
      [value.sourceKey, note.title, note.sourceUrl]
    )
    await connection.execute(
      "INSERT INTO knowledge_document_versions VALUES ('version','doc',1,?,?,'approved')",
      [JSON.stringify(value.metadata), note.content]
    )
    await connection.execute("INSERT INTO knowledge_chunks VALUES ('chunk','version',0,?,?,?)", [
      note.title,
      note.content,
      hash(note.content)
    ])
    await connection.execute("INSERT INTO knowledge_index_builds VALUES ('build',?)", [
      config.profileKey
    ])
    await connection.execute("INSERT INTO knowledge_vectors VALUES ('build','chunk',?)", [
      JSON.stringify(vector)
    ])
    const options = { sourceDirectory: directory, backupDirectory: path.join(directory, 'backups') }
    await fs.writeFile(
      path.join(directory, 'note.md'),
      formatMarkdown({ ...note, content: '资料发生变化' })
    )
    await assert.rejects(
      migrateLegacyKnowledge(database.store, connection, options),
      /Markdown与数据库当前资料不同/
    )
    assert.equal((await database.store.knowledge.list()).length, 0)
    assert.deepEqual(await database.store.exportData(), before)
    await fs.writeFile(path.join(directory, 'note.md'), formatMarkdown(note))
    const result = await migrateLegacyKnowledge(database.store, connection, options)
    assert.equal(result.documents, 1)
    assert.equal(result.trainingDataUnchanged, true)
    const backup = JSON.parse(await fs.readFile(result.backupFile, 'utf8'))
    assert.deepEqual(backup.training, before)
    assert.equal(backup.tables.knowledge_documents.length, 1)
    assert.deepEqual(await database.store.exportData(), before)
    const [tables] = await connection.query('SHOW TABLES')
    const names = tables.map((row) => Object.values(row)[0])
    assert.ok(names.includes('rag_documents') && names.includes('rag_chunks'))
    assert.equal(
      names.some((name) => name.startsWith('knowledge_')),
      false
    )
    const [chunks] = await connection.query('SELECT embedding FROM rag_chunks')
    assert.deepEqual(
      typeof chunks[0].embedding === 'string'
        ? JSON.parse(chunks[0].embedding)
        : chunks[0].embedding,
      vector
    )
    const [exported] = await readKnowledge(directory)
    assert.equal(exported.content, note.content)
    const service = createKnowledgeService(database.store.knowledge, {
      config,
      embedding: { embed: async () => [vector] }
    })
    const found = await service.retrieve({
      categoryId: 'react',
      topicId: 'react:effects',
      query: '副作用清理'
    })
    assert.equal(found.status, 'grounded')
    assert.equal(found.evidence[0].id, 'chunk')
    assert.equal((await service.importDocument(exported)).duplicate, true)
    assert.equal((await migrateLegacyKnowledge(database.store, connection)).migrated, false)
  } finally {
    await connection.end()
    await database.close()
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(directory).startsWith('rag-migration-test-'))
    await fs.rm(directory, { recursive: true, force: true })
  }
})
