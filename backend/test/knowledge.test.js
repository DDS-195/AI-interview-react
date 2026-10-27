const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { createKnowledgeService } = require('../services/knowledge/service')
const { knowledgeConfig } = require('../services/knowledge/config')
const { splitDocument } = require('../services/knowledge/chunker')
const { cosine } = require('../services/knowledge/similarity')
const { document } = require('../services/knowledge/validation')
const { parseMarkdown, formatMarkdown, readKnowledge } = require('../services/knowledge/markdown')
const { createApp } = require('../app')
const { completeQuestion } = require('../services/questionFlow')
const { grade } = require('../services/aiContract')
const { history } = require('../services/dataValidation')
const config = knowledgeConfig({ RAG_MODE: 'prefer' })
const note = (extras) => ({
  title: 'Effect 清理',
  sourceKey: 'effect',
  sourceUrl: 'https://react.dev/reference/react/useEffect',
  categoryId: 'react',
  topicIds: ['react:effects'],
  technicalVersion: 'React 18，函数组件与Hooks',
  kind: 'concept',
  content: '依赖变化时先运行旧的清理函数，再运行新的 setup；卸载时运行最后的清理函数。',
  ...extras
})
const scope = {
  categoryId: 'react',
  topicId: 'react:effects',
  technicalVersion: 'React 18，函数组件与Hooks',
  mode: 'theory',
  query: 'useEffect 清理'
}
const vector = [1, ...Array(383).fill(0)]
async function fixture(operation, options = {}) {
  const database = await createTemporaryDatabase()
  const service = createKnowledgeService(database.store.knowledge, {
    config,
    embedding: { embed: async (texts) => texts.map(() => [...vector]) },
    ...options
  })
  try {
    await operation(service, database)
  } finally {
    await service.close()
    await database.close()
  }
}
test('Markdown资料可读入，正文保留代码原文，非法分类和字段不进入数据库', async () => {
  const content = "```js\nconst message = 'Ａ';\n```"
  assert.equal(document(parseMarkdown(formatMarkdown(note({ content })))).content, content)
  assert.throws(() => parseMarkdown('没有头部'), /头部/)
  assert.throws(() => parseMarkdown('---\ntitle: "a"\ntitle: "b"\n---\n正文'), /重复/)
  for (const value of [
    note({ topicIds: ['vue:ref'] }),
    note({ sourceUrl: 'javascript:alert(1)' }),
    note({ content: ' ' })
  ]) {
    assert.throws(
      () => document(value),
      (error) => error.status === 400
    )
  }
  assert.equal((await readKnowledge()).length >= 34, true)
})
test('固定本地模型，只需配置RAG开关；切片保留完整代码块', () => {
  assert.equal(config.dimension, 384)
  assert.equal(config.provider, 'local')
  assert.equal(knowledgeConfig({ RAG_MODE: 'off' }).mode, 'off')
  assert.throws(() => knowledgeConfig({ RAG_MODE: 'invalid' }), /RAG_MODE/)
  const chunks = splitDocument(
    '# 机制\n\n解释\n\n```js\nconst a = 1\n\nconsole.log(a)\n```\n\n# 边界\n\n卸载清理',
    'Effect',
    25
  )
  assert.ok(
    chunks.some((chunk) => chunk.text.includes('console.log(a)') && chunk.text.includes('const a'))
  )
  assert.throws(() => splitDocument('```js\n未闭合', '题目'), /未闭合/)
  assert.equal(cosine(vector, vector), 1)
  assert.equal(
    cosine(
      vector,
      vector.map((x) => -x)
    ),
    -1
  )
})
test('两表知识导入幂等，更新原文后重新向量化，技术版本和知识点隔离', () =>
  fixture(async (service) => {
    const first = await service.importDocument(note())
    assert.equal((await service.retrieve(scope)).status, 'unavailable')
    assert.equal((await service.importDocument(note())).versionId, first.versionId)
    assert.deepEqual(await service.indexOnce(), { processed: 1 })
    const original = await service.retrieve(scope)
    assert.equal(original.method, 'semantic')
    assert.equal(original.status, 'grounded')
    assert.equal(original.evidence[0].documentVersionId, first.versionId)
    assert.equal(
      (await service.retrieve({ ...scope, technicalVersion: 'React 19' })).status,
      'unavailable'
    )
    assert.equal(
      (await service.retrieve({ ...scope, topicId: 'react:state' })).status,
      'unavailable'
    )
    const next = await service.importDocument(note({ content: '依赖变化之前，清理旧订阅。' }))
    assert.equal(next.revision, 2)
    assert.equal((await service.status()).ready, false)
    assert.equal((await service.retrieve(scope)).status, 'unavailable')
    await service.indexOnce()
    assert.equal((await service.retrieve(scope)).evidence[0].documentVersionId, next.versionId)
    assert.ok(original.evidence[0].text.includes('卸载'))
    assert.equal((await service.repository.exportData()).documents.length, 1)
  }))
test('向量失败不写入，重新执行可续跑；过期切片不能被旧计算结果覆盖', () =>
  fixture(async (service) => {
    await service.importDocument(note())
    const broken = createKnowledgeService(service.repository, {
      config,
      embedding: {
        embed: async () => {
          throw new Error('fixture unavailable')
        }
      }
    })
    await assert.rejects(broken.indexOnce(), /fixture unavailable/)
    assert.equal((await service.status()).pending, 1)
    const invalid = createKnowledgeService(service.repository, {
      config,
      embedding: { embed: async () => [[1]] }
    })
    await assert.rejects(invalid.indexOnce(), /向量无效/)
    const pending = await service.repository.pendingChunks(config.profileKey)
    await service.importDocument(note({ content: '新版正文' }))
    await service.repository.putVectors(pending, [vector], config.profileKey)
    assert.equal((await service.status()).indexed, 0)
    await service.indexOnce()
    assert.equal((await service.status()).ready, true)
  }))
test('导入失败事务回滚；HTTP仅提供查看和检索，不暴露审核和任务管理', () =>
  fixture(async (service, database) => {
    await assert.rejects(service.importDocument(note({ content: '```js\n未闭合' })), /未闭合/)
    assert.equal((await service.repository.list()).length, 0)
    const imported = await service.importDocument(note())
    const server = createApp({ dataStore: database.store, knowledgeService: service }).listen(
      0,
      '127.0.0.1'
    )
    await new Promise((resolve) => server.once('listening', resolve))
    const base = 'http://127.0.0.1:' + server.address().port + '/api/knowledge'
    try {
      assert.equal((await fetch(base + '/documents/' + imported.documentId)).status, 200)
      for (const endpoint of [
        '/imports',
        '/index',
        '/index/retry',
        '/versions/' + imported.versionId + '/review'
      ]) {
        const response = await fetch(base + endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        })
        assert.equal(response.status, 404)
      }
      assert.equal((await database.store.summary()).counts.questions, 0)
    } finally {
      server.closeAllConnections()
      await new Promise((resolve) => server.close(resolve))
    }
  }))
test('知识增强评分校验真实引用，保留rubric计分与历史固定依据', () =>
  fixture(async (service, database) => {
    await service.importDocument(note())
    await service.indexOnce()
    const knowledgeSnapshot = await service.retrieve(scope)
    const source = knowledgeSnapshot.evidence[0].id
    const plan = {
      category: 'react',
      topicId: 'react:effects',
      topic: 'useEffect',
      mode: 'theory',
      codeLanguage: 'javascript',
      difficulty: 'easy',
      technicalVersion: scope.technicalVersion
    }
    const value = {
      title: '清理时机',
      content: 'useEffect 的清理函数在什么时候执行？',
      difficulty: 'easy',
      topic: plan.topic,
      rubric: [
        {
          id: 'p1',
          description: '解释清理时机',
          weight: 100,
          expected: '依赖变化前清理上次订阅，卸载时清理最后订阅'
        }
      ],
      optionalPoints: [],
      referenceAnswer: '依赖变化时先清理旧副作用，卸载时执行最后一次清理。',
      rubricSources: { p1: [source] }
    }
    assert.throws(
      () =>
        completeQuestion(
          { ...value, rubricSources: { p1: ['fake'] } },
          plan,
          'fixture',
          knowledgeSnapshot
        ),
      (error) => error.status === 502 && /未检索/.test(error.message)
    )
    assert.throws(
      () =>
        completeQuestion(
          { ...value, rubricSources: undefined },
          plan,
          'fixture',
          knowledgeSnapshot
        ),
      (error) => error.status === 502
    )
    const question = completeQuestion(value, plan, 'fixture', knowledgeSnapshot)
    const answer = '依赖变化前执行清理'
    const result = {
      criteria: [
        {
          id: 'p1',
          verdict: 'partial',
          evidence: answer,
          explanation: '说明了依赖变化，缺少卸载清理',
          sourceIds: [source]
        }
      ],
      suggestions: [],
      uncertainties: []
    }
    assert.throws(
      () =>
        grade(
          { ...result, criteria: [{ ...result.criteria[0], sourceIds: ['fake'] }] },
          question,
          answer
        ),
      /固定依据/
    )
    const evaluation = grade(result, question, answer)
    assert.equal(evaluation.score, 50)
    await database.store.putQuestion(question)
    const record = history({
      ...evaluation,
      questionId: question.id,
      answer,
      submittedAt: '2026-10-12T00:00:00.000Z',
      questionSnapshot: question
    })
    await database.store.addHistory(record)
    await database.store.putQuestion({ ...question, title: '题目已更新' })
    await service.importDocument(note({ content: '知识资料已修改' }))
    const saved = await database.store.historyDetail(record.submittedAt)
    assert.equal(saved.question.title, question.title)
    assert.deepEqual(saved.record.knowledgeSnapshot, question.knowledgeSnapshot)
    assert.deepEqual(saved.record.criteria[0].sourceIds, [source])
  }))
test('模型不可用明确回退原出题，取消请求不返回成功结果', () =>
  fixture(async (service) => {
    await service.importDocument(note())
    await service.indexOnce()
    const broken = createKnowledgeService(service.repository, {
      config,
      embedding: {
        embed: async () => {
          throw new Error('fixture unavailable')
        }
      }
    })
    const result = await broken.retrieve(scope)
    assert.equal(result.status, 'unavailable')
    assert.match(result.reason, /常规出题/)
    const controller = new AbortController()
    controller.abort(new Error('fixture cancelled'))
    await assert.rejects(
      service.retrieve(scope, { signal: controller.signal }),
      /fixture cancelled/
    )
  }))
