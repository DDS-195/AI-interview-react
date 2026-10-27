const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { PassThrough } = require('node:stream')
const express = require('express')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { questions } = require('./fixtures/grading')
let output
let createStream
let calls = []
let serial = 0
const servicePath = require.resolve('../services/aiService')
require.cache[servicePath] = {
  id: servicePath,
  filename: servicePath,
  loaded: true,
  exports: {
    callAI: async (system, user, options) => {
      calls.push({ system, user, options })
      return {
        content: typeof output === 'function' ? output(system, user, options) : output,
        model: 'fixture-model',
        finishReason: 'stop'
      }
    },
    callAIStream: async (system, user, options) => {
      calls.push({ system, user, options })
      return createStream(system, user, options)
    }
  }
}
const app = express()
app.use(express.json())
app.use('/api/ai', require('../routes/questions'))
app.use('/api/ai', require('../routes/evaluation'))
let server
let base
let database
let store
const frame = (value) => 'data: ' + JSON.stringify(value) + '\n\n'
function generated(user, extra = {}) {
  const plan = JSON.parse(user.split('\n')[1])
  return {
    title: '测试题目' + ++serial,
    content: '明确描述测试题目行为及边界' + serial,
    difficulty: plan.difficulty,
    topic: plan.topic,
    rubric: [{ id: 'p1', description: '题目明确要求', weight: 100, expected: '正确要点' }],
    optionalPoints: [],
    referenceAnswer: '参考要点',
    ...extra
  }
}
function streamOf(
  user,
  { finish = 'stop', done = true, extra = {}, bytewise = false, eof = false, error = false } = {}
) {
  const stream = new PassThrough()
  let raw = frame({
    model: 'fixture-model',
    choices: [{ delta: { content: JSON.stringify(generated(user, extra)) }, finish_reason: null }]
  })
  if (error) {
    raw += frame({ error: { message: 'provider error' } })
  }
  if (!eof) {
    raw += frame({ choices: [{ delta: {}, finish_reason: finish }] })
  }
  if (done && !eof) {
    raw += 'data: [DONE]\n\n'
  }
  if (!done) {
    raw = raw.trimEnd()
  }
  setImmediate(() => {
    if (bytewise) {
      for (const byte of Buffer.from(raw)) {
        stream.write(Buffer.from([byte]))
      }
      stream.end()
    } else {
      stream.end(raw)
    }
  })
  return stream
}
const gradeOutput = (question = questions[0], verdict = 'incorrect', evidence = '回答') =>
  JSON.stringify({
    criteria: question.rubric.map((x) => ({
      id: x.id,
      verdict,
      evidence,
      explanation: '逐项判断说明'
    })),
    suggestions: [],
    uncertainties: []
  })
before(async () => {
  database = await createTemporaryDatabase()
  store = database.store
  app.locals.dataStore = store
  for (const q of questions) {
    await store.putQuestion(q)
  }
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = 'http://127.0.0.1:' + server.address().port + '/api/ai'
})
beforeEach(() => {
  calls = []
  output = gradeOutput()
  createStream = (_system, user) => streamOf(user)
})
after(async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
  if (database) {
    await database.close()
  }
})
const post = (route, body) =>
  fetch(base + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
const evaluate = (answer = '回答') =>
  post('/evaluate-answer', { questionId: questions[0].id, answer })
const events = async (response) =>
  (await response.text())
    .split('\n')
    .filter((x) => x.startsWith('data: '))
    .map((x) => JSON.parse(x.slice(6)))

test('知识来源漏字段只修复一次，提示词示例包含来源，持续无效时不保存题目', async () => {
  const { hash } = require('../services/knowledge/validation')
  const technicalVersion = require('../services/questionPlan').versionFor('react', 'react:effects')
  const text = '依赖改变时先清理旧副作用，再建立新副作用。'
  const snapshot = {
    status: 'grounded',
    method: 'semantic',
    retrievedAt: new Date().toISOString(),
    indexProfile: '0'.repeat(64),
    retrievalVersion: 'retrieval-simple-v2',
    evidence: [
      {
        id: 'chunk',
        documentId: 'doc',
        documentVersionId: 'version',
        revision: 1,
        title: 'Effect 顺序',
        url: 'https://react.dev/reference/react/useEffect',
        heading: '清理',
        text,
        technicalVersion,
        contentHash: hash(text),
        kind: 'concept'
      }
    ]
  }
  const previous = app.locals.knowledgeService
  app.locals.knowledgeService = { config: { mode: 'prefer' }, retrieve: async () => snapshot }
  try {
    const before = (await store.summary()).counts.questions
    output = (_system, user) =>
      JSON.stringify(
        generated(user, calls.length === 1 ? {} : { rubricSources: { p1: ['chunk'] } })
      )
    const response = await post('/generate-question', {
      category: 'react',
      topicId: 'react:effects',
      mode: 'theory'
    })
    assert.equal(response.status, 200)
    assert.equal(calls.length, 2)
    assert.match(calls[0].user, /输出示例：.*"rubricSources"/)
    assert.deepEqual((await response.json()).rubricSources, { p1: ['chunk'] })
    assert.equal((await store.summary()).counts.questions, before + 1)
    calls = []
    output = (_system, user) => JSON.stringify(generated(user))
    const failed = await post('/generate-question', {
      category: 'react',
      topicId: 'react:effects',
      mode: 'theory'
    })
    assert.equal(failed.status, 502)
    assert.equal(calls.length, 2)
    assert.equal((await store.summary()).counts.questions, before + 1)
  } finally {
    app.locals.knowledgeService = previous
  }
})

test('0分是真实分项汇总，保留参考和模型版本', async () => {
  const response = await evaluate()
  assert.equal(response.status, 200)
  const value = await response.json()
  assert.equal(value.score, 0)
  assert.equal(value.criteria.length, 3)
  assert.equal(value.correctAnswer, questions[0].referenceAnswer)
  assert.equal(value.model, 'fixture-model')
  assert.equal(
    value.promptVersion,
    require('../prompts/evaluationPrompts').EVALUATION_PROMPT_VERSION
  )
})
test('评分成功前完整历史已经保存，重试同一次提交不重复调用模型', async () => {
  const submittedAt = '2026-10-11T00:00:01.000Z'
  const body = { questionId: questions[0].id, answer: '回答', submittedAt }
  const first = await post('/evaluate-answer', body)
  assert.equal(first.status, 200)
  const result = await first.json()
  assert.equal(result.submittedAt, submittedAt)
  const saved = await store.historyDetail(submittedAt)
  assert.equal(saved.record.score, 0)
  assert.deepEqual(saved.record.criteria, result.criteria)
  assert.equal(saved.record.model, result.model)
  const replay = await post('/evaluate-answer', body)
  assert.equal(replay.status, 200)
  assert.deepEqual(await replay.json(), result)
  assert.equal(calls.length, 1)
  const conflict = await post('/evaluate-answer', { ...body, answer: '另一份回答' })
  assert.equal(conflict.status, 409)
  assert.equal(calls.length, 1)
})
test('保存历史失败不返回评分成功，也不再次请求模型', async () => {
  const original = store.addHistory
  store.addHistory = async () => {
    throw new Error('模拟磁盘写入失败')
  }
  try {
    const response = await evaluate()
    assert.equal(response.status, 503)
    assert.equal((await response.json()).score, undefined)
    assert.equal(calls.length, 1)
  } finally {
    store.addHistory = original
  }
})
test('同一次提交的并发请求只评分一次、保存一条历史', { timeout: 5000 }, async () => {
  const body = {
    questionId: questions[0].id,
    answer: '回答',
    submittedAt: '2026-10-11T00:00:02.000Z'
  }
  const original = store.getQuestion
  const originalDetail = store.historyDetail
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  let arrived
  let reads = 0
  const twoRequests = new Promise((resolve) => {
    arrived = resolve
  })
  store.historyDetail = async (id) => {
    const result = await originalDetail(id)
    if (id === body.submittedAt && ++reads === 2) {
      arrived()
    }
    return result
  }
  store.getQuestion = async (id) => {
    await gate
    return original(id)
  }
  try {
    const first = post('/evaluate-answer', body)
    const second = post('/evaluate-answer', body)
    await twoRequests
    release()
    const responses = await Promise.all([first, second])
    assert.deepEqual(
      responses.map((response) => response.status),
      [200, 200]
    )
    assert.deepEqual(await responses[0].json(), await responses[1].json())
    assert.equal(calls.length, 1)
    assert.ok((await store.historyDetail(body.submittedAt)).record.criteria.length)
  } finally {
    release()
    store.getQuestion = original
    store.historyDetail = originalDetail
  }
})
test('没有换行的超长流式消息被拒绝，存储失败不会重新调用模型', async () => {
  const { consumeStream } = require('../services/questionFlow')
  const stream = new PassThrough()
  setImmediate(() => stream.end('data: ' + 'x'.repeat(70000)))
  await assert.rejects(consumeStream(stream), /流式消息超长/)
  const original = store.putGeneratedQuestion
  store.putGeneratedQuestion = async () => {
    throw new Error('模拟磁盘写入失败')
  }
  try {
    const result = await events(await post('/generate-question-stream', { category: 'react' }))
    assert.equal(
      result.some((event) => event.done),
      false
    )
    assert.match(result.find((event) => event.error).error, /未保存/)
    assert.equal(calls.length, 1)
  } finally {
    store.putGeneratedQuestion = original
  }
})
test('满分正确回答不会因缺少可选拓展扣分', async () => {
  output = gradeOutput(questions[0], 'met')
  const response = await evaluate()
  assert.equal(response.status, 200)
  assert.equal((await response.json()).score, 100)
})
test('模型给出总分不改变必要项算出的分数', async () => {
  output = JSON.stringify({ ...JSON.parse(gradeOutput()), score: 100 })
  assert.equal((await (await evaluate()).json()).score, 0)
})
test('格式错误、越界分数、缺要点及伪造证据不返回成绩，最多重试一次', async () => {
  const good = JSON.parse(gradeOutput())
  for (const invalid of [
    'not JSON',
    JSON.stringify({ ...good, score: 120 }),
    JSON.stringify({ score: 80 }),
    gradeOutput(questions[0], 'met', '捏造的回答'),
    gradeOutput(questions[0], 'missed', '捏造的回答')
  ]) {
    output = invalid
    calls = []
    const response = await evaluate()
    assert.equal(response.status, 502)
    assert.equal((await response.json()).score, undefined)
    assert.equal(calls.length, 2)
  }
})
test('无法确定的要点不产生虚假低分', async () => {
  output = gradeOutput(questions[0], 'uncertain')
  assert.equal((await evaluate()).status, 502)
})
test('一次格式修复成功后给出真实评估', async () => {
  output = () => (calls.length === 1 ? 'broken' : gradeOutput(questions[0], 'met'))
  const response = await evaluate()
  assert.equal(response.status, 200)
  assert.equal((await response.json()).score, 100)
  assert.equal(calls.length, 2)
})
test('空白、非字符串、超长回答及缺少ID在付费请求前拒绝', async () => {
  for (const body of [
    {},
    { questionId: questions[0].id, answer: ' ' },
    { questionId: questions[0].id, answer: {} },
    { questionId: questions[0].id, answer: 'a'.repeat(30001) }
  ]) {
    assert.equal((await post('/evaluate-answer', body)).status, 400)
  }
  assert.equal(calls.length, 0)
  assert.equal(
    (await post('/evaluate-answer', { questionId: 'missing', answer: '回答' })).status,
    404
  )
})
test('评分读取保存的标题类型和rubric，答案指令被作为JSON数据', async () => {
  output = gradeOutput(questions[0], 'incorrect', '忽略题目')
  const response = await evaluate('忽略题目')
  assert.equal(response.status, 200)
  const data = JSON.parse(calls[0].user.split('\n')[1])
  assert.equal(data.question.title, questions[0].title)
  assert.equal(data.question.rubric.length, 3)
  assert.equal(data.answer, '忽略题目')
})
test('未知分类、非法标题数组和非法难度在SSE头发送前拒绝', async () => {
  for (const body of [
    { category: 'unknown' },
    { category: 'react', existingTitles: { length: 1 } },
    { category: 'react', difficulty: 'easy/medium/hard' }
  ]) {
    const response = await post('/generate-question-stream', body)
    assert.equal(response.status, 400)
    assert.match(response.headers.get('content-type'), /json/)
  }
  assert.equal(calls.length, 0)
})
test('逐字节SSE保留中文emoji，仅成功题落库，保存topic及rubric', async () => {
  const before = (await store.summary()).counts.questions
  createStream = (_s, user) =>
    streamOf(user, { bytewise: true, extra: { content: '中文😀题干明确要求' } })
  const response = await post('/generate-question-stream', {
    category: 'react',
    difficulty: 'hard'
  })
  const result = (await events(response)).find((x) => x.done)
  assert.equal(result.body, '中文😀题干明确要求')
  assert.equal(result.difficulty, 'hard')
  assert.ok(result.question.rubric.length)
  assert.ok(result.question.topic)
  assert.deepEqual(await store.getQuestion(result.question.id), result.question)
  assert.equal((await store.summary()).counts.questions, before + 1)
})
test('最后finish消息无换行、缺少DONE时也可成功，但须finish_reason=stop', async () => {
  createStream = (_s, user) => streamOf(user, { done: false })
  const result = await events(await post('/generate-question-stream', { category: 'react' }))
  assert.ok(result.some((x) => x.done))
})
test('截断、未知结束、意外EOF及供应商错误不成功、不保存', async () => {
  const before = (await store.summary()).counts.questions
  for (const options of [
    { finish: 'length' },
    { finish: 'content_filter' },
    { eof: true },
    { error: true }
  ]) {
    createStream = (_s, user) => streamOf(user, options)
    calls = []
    const result = await events(await post('/generate-question-stream', { category: 'react' }))
    assert.equal(
      result.some((x) => x.done),
      false
    )
    assert.ok(result.some((x) => x.error))
    assert.equal(calls.length, 2)
  }
  assert.equal((await store.summary()).counts.questions, before)
})
test('只给标题、拒绝文本及无效元信息都不保存', async () => {
  for (const extra of [
    { content: '' },
    { title: '抱歉无法生成题目' },
    { difficulty: 'easy/medium/hard' },
    { rubric: [{ id: 'p1', description: '要求', weight: 80, expected: '要点' }] }
  ]) {
    createStream = (_s, user) => streamOf(user, { extra })
    const result = await events(await post('/generate-question-stream', { category: 'react' }))
    assert.equal(
      result.some((x) => x.done),
      false
    )
    assert.ok(result.some((x) => x.error))
  }
})
test('重复标题自动重选一次；重复正文即使换标题也被阻止', async () => {
  const old = questions[0]
  let attempt = 0
  createStream = (_s, user) =>
    streamOf(user, { extra: ++attempt === 1 ? { title: old.title } : {} })
  const result = await events(await post('/generate-question-stream', { category: 'react' }))
  assert.ok(result.some((x) => x.done))
  assert.equal(attempt, 2)
  createStream = (_s, user) => streamOf(user, { extra: { content: old.content } })
  const duplicate = await events(await post('/generate-question-stream', { category: 'react' }))
  assert.equal(
    duplicate.some((x) => x.done),
    false
  )
})
test('非流式和流式共用校验及出题规则', async () => {
  output = (_s, user) => JSON.stringify(generated(user))
  const response = await post('/generate-question', { category: 'scenario' })
  assert.equal(response.status, 200)
  const q = await response.json()
  assert.equal(q.category, 'scenario')
  assert.ok(q.rubric.length)
  assert.match(calls[0].user, /业务背景/)
  assert.doesNotMatch(calls[0].user, /禁止.*场景/)
})
test('旧useEffect题补充核对过的要点，不改题干；参考不由评分模型重新编造', async () => {
  const legacy = { ...questions[0], id: 'old-effect' }
  delete legacy.rubric
  delete legacy.referenceAnswer
  delete legacy.referenceStatus
  await store.putQuestion(legacy)
  output = gradeOutput(questions[0], 'met')
  const response = await post('/evaluate-answer', { questionId: legacy.id, answer: '回答' })
  assert.equal(response.status, 200)
  const q = await store.getQuestion(legacy.id)
  assert.equal(q.content, legacy.content)
  assert.equal(q.referenceStatus, 'verified')
  assert.match((await response.json()).correctAnswer, /cleanup一次/)
  assert.equal(calls.length, 1)
})
test('取消生成会关闭上游，避免继续产生费用', async (t) => {
  let upstream
  createStream = () => {
    upstream = new PassThrough()
    setImmediate(() =>
      upstream.write(
        frame({ choices: [{ delta: { content: '{"title":"还在生成' }, finish_reason: null }] })
      )
    )
    return upstream
  }
  t.after(() => upstream?.destroy())
  const controller = new AbortController()
  const response = await fetch(base + '/generate-question-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: 'react' }),
    signal: controller.signal
  })
  await response.body.getReader().read()
  const closed = new Promise((resolve) => upstream.once('close', resolve))
  controller.abort()
  let timeout
  try {
    await Promise.race([
      closed,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('未关闭上游')), 1000)
      })
    ])
  } finally {
    clearTimeout(timeout)
  }
})
test('增加其他要求的自由题不能冒用基准题已核对的参考和评分要点', () => {
  const { referenceFor, verifiedRubric } = require('../data/knowledge')
  const general = {
    ...questions[0],
    content: questions[0].content + '另请实现一个请求竞态处理Hook。'
  }
  assert.equal(referenceFor(general).referenceStatus, 'generated')
  assert.equal(verifiedRubric(general), null)
  assert.equal(
    referenceFor({ ...questions[0], content: questions[0].content.replaceAll(' ', '') })
      .referenceStatus,
    'verified'
  )
})
test('新题按题型限制题干长度，超长拒绝而非截断，旧题不受影响', () => {
  const { completeQuestion } = require('../services/questionFlow')
  for (const [category, max] of [
    ['react', 140],
    ['scenario', 200],
    ['coding', 320]
  ]) {
    const plan = { category, topic: '核心考点', difficulty: 'medium', technicalVersion: '测试环境' }
    const value = {
      title: '简短问题',
      content: '问'.repeat(max),
      topic: plan.topic,
      difficulty: plan.difficulty,
      rubric: [{ id: 'p1', description: '必要要求', weight: 100, expected: '正确要点' }],
      optionalPoints: [],
      referenceAnswer: '参考要点'
    }
    assert.equal(completeQuestion(value, plan, 'fixture-model').content, value.content)
    assert.throws(
      () => completeQuestion({ ...value, content: value.content + '问' }, plan, 'fixture-model'),
      /题干过长/
    )
  }
  const legacy = { ...questions[0], content: '原有题干'.repeat(100) }
  assert.equal(require('../services/dataStore').question(legacy).content, legacy.content)
})
test('过长题干最多重写一次，保存简短新题而非长题的截断片段', async () => {
  let attempt = 0
  createStream = (_s, user) =>
    streamOf(user, {
      extra:
        ++attempt === 1
          ? { content: '多余说明'.repeat(60) }
          : { content: 'useEffect 的清理函数何时执行？' }
    })
  const result = await events(await post('/generate-question-stream', { category: 'react' }))
  const done = result.find((x) => x.done)
  assert.equal(attempt, 2)
  assert.equal(done.body, 'useEffect 的清理函数何时执行？')
})

test('新分类、题型与固定知识点贯通生成和存储，理论与手写不再绑定分类', async () => {
  for (const [category, topicId, mode, type] of [
    ['react', 'react:effects', 'coding', 'code'],
    ['security', 'security:xss', 'scenario', 'text'],
    ['testing', 'testing:async', 'debug', 'text'],
    ['html-css', 'html-css:grid', 'coding', 'code']
  ]) {
    const result = await events(
      await post('/generate-question-stream', { category, topicId, mode, difficulty: 'medium' })
    )
    const q = result.find((event) => event.done)?.question
    assert.ok(q, JSON.stringify(result))
    assert.equal(q.categoryId, category)
    assert.equal(q.mode, mode)
    assert.equal(q.topicId, topicId)
    assert.equal(q.type, type)
    assert.equal(q.codeLanguage, category === 'html-css' ? 'css' : 'javascript')
    assert.deepEqual(await store.getQuestion(q.id), q)
  }
})
test('非法模式、跨分类知识点与伪造字段在AI请求前拒绝', async () => {
  for (const body of [
    { category: 'react', mode: 'unknown' },
    { category: 'react', mode: null },
    { category: 'react', mode: '' },
    { category: 'security', topicId: 'react:effects' },
    { category: 'react', topicId: {} },
    { category: '__proto__' }
  ]) {
    assert.equal((await post('/generate-question-stream', body)).status, 400)
  }
  assert.equal(calls.length, 0)
})
test('合并分类使用规范ID；旧分类题目仍可保存和读取', async () => {
  const { validateInput } = require('../services/questionPlan')
  assert.equal(validateInput({ category: 'es6' }).category, 'javascript')
  assert.equal(validateInput({ category: 'git' }).category, 'engineering')
  for (const category of ['es6', 'git', 'scenario', 'coding']) {
    const legacy = { ...questions[0], id: 'legacy-category-' + category, categoryId: category }
    await store.putQuestion(legacy)
    assert.equal((await store.getQuestion(legacy.id)).categoryId, category)
  }
})
test('四组核心领域覆盖16个分类，所有知识点ID唯一，固定考点和新模式保留短题干限制', () => {
  const { catalog, topicEntries } = require('../data/topics')
  const { completeQuestion } = require('../services/questionFlow')
  assert.equal(catalog.groups.length, 4)
  const categories = catalog.groups.flatMap((group) => group.categories)
  assert.equal(new Set(categories).size, 16)
  const ids = catalog.categories.flatMap((category) =>
    topicEntries(category.id).map((topic) => topic.id)
  )
  assert.equal(new Set(ids).size, ids.length)
  for (const [mode, max] of [
    ['theory', 140],
    ['scenario', 200],
    ['coding', 320],
    ['debug', 320]
  ]) {
    const plan = {
      category: 'react',
      topic: 'useEffect依赖与清理',
      topicId: 'react:effects',
      mode,
      difficulty: 'medium',
      technicalVersion: 'React 18'
    }
    const value = {
      title: '测试模式长度',
      content: '问'.repeat(max),
      difficulty: plan.difficulty,
      topic: plan.topic,
      rubric: [{ id: 'p1', description: '明确要求', weight: 100, expected: '正确要点' }],
      optionalPoints: [],
      referenceAnswer: '参考要点'
    }
    assert.equal(completeQuestion(value, plan, 'fixture').mode, mode)
    assert.throws(
      () => completeQuestion({ ...value, content: value.content + '问' }, plan, 'fixture'),
      /题干过长/
    )
  }
})

test('概念型知识点拒绝不合适模式，自动选题仅选择支持模式的知识点', async () => {
  const { topicEntries } = require('../data/topics')
  const { validateInput, makePlan } = require('../services/questionPlan')
  for (const body of [
    { category: 'network', topicId: 'network:dns', mode: 'coding' },
    { category: 'engineering', topicId: 'engineering:git-recovery', mode: 'debug' },
    { category: 'governance', mode: 'coding' }
  ]) {
    assert.equal((await post('/generate-question-stream', body)).status, 400)
  }
  assert.equal(calls.length, 0)
  const input = validateInput({ category: 'network', mode: 'coding' })
  const plan = await makePlan(store, input)
  assert.ok(
    topicEntries('network')
      .find((topic) => topic.id === plan.topicId)
      .modes.includes('coding')
  )
})

test('评分响应和完整历史保留新题的分类、知识点、题型与代码语言', async () => {
  const generatedEvents = await events(
    await post('/generate-question-stream', {
      category: 'typescript',
      topicId: 'typescript:generics',
      mode: 'coding',
      difficulty: 'easy'
    })
  )
  const q = generatedEvents.find((event) => event.done).question
  output = gradeOutput(q, 'met')
  const response = await post('/evaluate-answer', {
    questionId: q.id,
    answer: '回答',
    submittedAt: '2026-10-11T00:00:03.000Z'
  })
  assert.equal(response.status, 200)
  const result = await response.json()
  const detail = await store.historyDetail(result.submittedAt)
  const saved = detail.record
  for (const metadata of [result, saved]) {
    assert.equal(metadata.mode, 'coding')
    assert.equal(metadata.topicId, 'typescript:generics')
    assert.equal(metadata.codeLanguage, 'typescript')
  }
  assert.equal(detail.question.categoryId, 'typescript')
  assert.equal(saved.score, 100)
})

test('新增专项和版本专属考点可通过完整出题API保存，跨领域组合仍被拒绝', async () => {
  for (const [category, topicId, mode] of [
    ['ai-apps', 'ai-apps:structured-output', 'coding'],
    ['web-components', 'web-components:events', 'debug'],
    ['complex-ui', 'complex-ui:selection', 'theory'],
    ['desktop', 'desktop:ipc', 'scenario'],
    ['react', 'react:action-state', 'coding']
  ]) {
    const result = await events(
      await post('/generate-question-stream', { category, topicId, mode, difficulty: 'easy' })
    )
    const q = result.find((event) => event.done)?.question
    assert.ok(q, JSON.stringify(result))
    assert.equal(q.categoryId, category)
    assert.equal(q.topicId, topicId)
    assert.equal(q.mode, mode)
    assert.deepEqual(await store.getQuestion(q.id), q)
    if (topicId === 'react:action-state') {
      assert.match(q.technicalVersion, /React 19/)
    }
  }
  calls = []
  assert.equal(
    (
      await post('/generate-question-stream', {
        category: 'desktop',
        topicId: 'ai-apps:tools',
        mode: 'scenario'
      })
    ).status,
    400
  )
  assert.equal(calls.length, 0)
})
