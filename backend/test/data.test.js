const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { createDataStore } = require('../services/dataStore')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { migrateLegacyData } = require('../database/legacyData')
let directory
let database
let server
let base
let app
const q = (id) => ({
  id,
  categoryId: 'react',
  title: `测试题目 ${id}`,
  content: '说明状态更新',
  difficulty: 'medium',
  type: 'text'
})
const record = {
  questionId: 'q1',
  answer: '答案',
  submittedAt: '2026-01-01T00:00:00.000Z',
  score: 0,
  feedback: '完整反馈',
  correctAnswer: '完整参考答案'
}
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-interview-test-'))
  database = await createTemporaryDatabase()
  app = require('../app').createApp({ dataStore: database.store })
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api/data`
})
after(async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  }
  if (database) {
    await database.close()
  }
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
  assert.ok(path.basename(directory).startsWith('ai-interview-test-'))
  await fs.rm(directory, { recursive: true, force: true })
})
async function request(route = '', method = 'GET', body, expected = 200) {
  const response = await fetch(base + route, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  })
  const result = await response.json()
  assert.equal(response.status, expected, JSON.stringify(result))
  return result
}

test('请求边界返回正确状态：无效JSON、过大正文及外站写入', async () => {
  const malformed = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{broken'
  })
  assert.equal(malformed.status, 400)
  assert.match((await malformed.json()).error, /JSON/)
  const oversized = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'a'.repeat(10 * 1024 * 1024) })
  })
  assert.equal(oversized.status, 413)
  const foreign = await fetch(base + '/favorites/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    body: JSON.stringify({ questionId: 'missing' })
  })
  assert.equal(foreign.status, 403)
})
test('数据库不可读时健康检查返回503，恢复后重试成功', async () => {
  const original = app.locals.dataStore.summary
  app.locals.dataStore.summary = async () => {
    throw new Error('模拟MySQL暂不可用')
  }
  try {
    const response = await fetch(base.replace('/data', '/health'))
    assert.equal(response.status, 503)
    assert.match((await response.json()).error, /暂不可用/)
  } finally {
    app.locals.dataStore.summary = original
  }
  assert.equal((await fetch(base.replace('/data', '/health'))).status, 200)
})
test('MySQL不可连接时数据与AI入口均返回503，不掩盖为模型故障', async () => {
  const badStore = createDataStore({ ...database.config, port: 1, connectTimeout: 1000 })
  const badApp = require('../app').createApp({ dataStore: badStore })
  const badServer = badApp.listen(0, '127.0.0.1')
  await new Promise((resolve) => badServer.once('listening', resolve))
  const url = 'http://127.0.0.1:' + badServer.address().port
  try {
    const response = await fetch(url + '/api/data')
    assert.equal(response.status, 503)
    assert.match((await response.json()).error, /暂不可用/)
    const evaluation = await fetch(url + '/api/ai/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: 'q1', answer: '回答' })
    })
    assert.equal(evaluation.status, 503)
    const generation = await fetch(url + '/api/ai/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'react' })
    })
    assert.equal(generation.status, 503)
  } finally {
    badServer.closeAllConnections()
    await new Promise((resolve) => badServer.close(resolve))
    await badStore.close()
  }
})
test('完整详情与零分保存到数据库，重开仍可读取，写入只返回变更', async () => {
  assert.deepEqual(await request(), {
    counts: { questions: 0, favorites: 0, history: 0 },
    favorites: []
  })
  await request('/questions/q1', 'PUT', q('q1'))
  await request('/favorites/toggle', 'POST', { questionId: 'q1' })
  const change = await request('/history', 'POST', record)
  assert.deepEqual(change, { counts: { questions: 1, favorites: 1, history: 1 } })
  const detail = await request('/history/' + encodeURIComponent(record.submittedAt))
  assert.deepEqual(detail, { record, question: q('q1') })
  const reopened = createDataStore(database.config)
  try {
    assert.deepEqual(await reopened.exportData(), await request('/export'))
  } finally {
    await reopened.close()
  }
})
test('并发保存和切换收藏不会覆盖其他数据', async () => {
  await Promise.all(
    Array.from({ length: 8 }, (_, id) => request(`/questions/q-${id}`, 'PUT', q(`q-${id}`)))
  )
  await Promise.all(
    Array.from({ length: 6 }, () => request('/favorites/toggle', 'POST', { questionId: 'q1' }))
  )
  assert.deepEqual((await request()).counts, { questions: 9, favorites: 1, history: 1 })
})
test('旧浏览器数据合并去重，保留现有完整历史和新导入详情', async () => {
  const incoming = {
    questions: [q('legacy')],
    favorites: [],
    history: [
      { ...record, feedback: '不能覆盖' },
      { ...record, submittedAt: '2025-01-01T00:00:00.000Z', feedback: '迁移详情' }
    ]
  }
  await request('/import', 'POST', incoming)
  assert.equal((await request('/import', 'POST', incoming)).counts.questions, 10)
  const data = await request('/export')
  assert.equal(data.history.length, 2)
  assert.equal(data.history[0].feedback, record.feedback)
  assert.equal(data.history[1].feedback, '迁移详情')
})
test('非法数据、缺失题目及重复历史不改变已保存数据', async () => {
  const original = await request('/export')
  await request('/history', 'POST', record, 409)
  await request('/history', 'POST', { ...record, score: 101 }, 400)
  await request('/questions/mismatch', 'PUT', q('q1'), 400)
  await request('/favorites/toggle', 'POST', { questionId: 'missing' }, 404)
  await request('/import', 'POST', { ...original, history: [{ ...record, score: NaN }] }, 400)
  assert.deepEqual(await request('/export'), original)
})
test('列表按页返回短摘要，详情按需读取，删除最后一页后页码收敛', async () => {
  const rows = Array.from({ length: 18 }, (_, i) => ({
    ...record,
    submittedAt: new Date(Date.UTC(2026, 1, i + 1)).toISOString(),
    answer: '长答案'.repeat(1000)
  }))
  await request('/import', 'POST', { questions: [], favorites: [], history: rows })
  const list = await request('/history?page=2&pageSize=6')
  assert.equal(list.total, 20)
  assert.equal(list.items.length, 6)
  assert.equal(list.items[0].preview.length, 160)
  assert.equal(list.items[0].answer, undefined)
  assert.equal(list.items[0].feedback, undefined)
  assert.deepEqual(list.distribution, [{ categoryId: 'react', value: 20 }])
  assert.equal(
    (await request('/history/' + encodeURIComponent(list.items[0].submittedAt))).record.answer
      .length,
    3000
  )
  assert.equal((await request('/history?page=999&pageSize=6')).page, 4)
  await request('/history?page=0', 'GET', undefined, 400)
  await request('/history?pageSize=101', 'GET', undefined, 400)
  const change = await request('/favorites/toggle', 'POST', { questionId: 'q1' })
  assert.ok(JSON.stringify(change).length < 200)
  await request('/history', 'DELETE')
  assert.equal((await request('/history?page=4')).page, 1)
  await request('/history/' + encodeURIComponent(record.submittedAt), 'GET', undefined, 404)
})
test('收藏分页保留题目短摘要，单条和批量删除保留题目', async () => {
  await request('/favorites/toggle', 'POST', { questionId: 'q1' })
  const list = await request('/favorites')
  assert.equal(list.items[0].question.title, q('q1').title)
  assert.equal(list.items[0].preview, q('q1').content)
  await request('/favorites/q1', 'DELETE')
  await request('/favorites', 'DELETE')
  assert.deepEqual((await request()).counts, { questions: 10, favorites: 0, history: 0 })
})
test('JSON迁移保持备份原文，重启后不重新导入已删除记录', async () => {
  const legacyFile = path.join(directory, 'legacy.json')
  const original = JSON.stringify(
    {
      questions: [q('q1')],
      favorites: [{ questionId: 'q1', addedAt: record.submittedAt }],
      history: [record]
    },
    null,
    2
  )
  await fs.writeFile(legacyFile, original)
  const fixture = await createTemporaryDatabase()
  const first = fixture.store
  try {
    await migrateLegacyData(first, legacyFile)
    assert.deepEqual((await first.exportData()).history, [record])
    await first.clearHistory()
  } finally {
    await first.close()
  }
  const second = createDataStore(fixture.config)
  try {
    assert.equal((await migrateLegacyData(second, legacyFile)).alreadyMigrated, true)
    assert.equal((await second.summary()).counts.history, 0)
  } finally {
    await second.close()
    await fixture.close()
  }
  assert.equal(await fs.readFile(legacyFile, 'utf8'), original)
})
test('损坏 JSON 不被覆盖，修复后可以重试迁移与保存', async () => {
  const damagedFile = path.join(directory, 'damaged.json')
  await fs.writeFile(damagedFile, '{broken')
  const fixture = await createTemporaryDatabase()
  const store = fixture.store
  try {
    await assert.rejects(migrateLegacyData(store, damagedFile), /无法读取/)
    assert.equal((await store.summary()).counts.questions, 0)
    assert.equal(await fs.readFile(damagedFile, 'utf8'), '{broken')
    await fs.writeFile(damagedFile, JSON.stringify({ questions: [], favorites: [], history: [] }))
    await migrateLegacyData(store, damagedFile)
    assert.equal((await store.putQuestion(q('recovered'))).counts.questions, 1)
  } finally {
    await fixture.close()
  }
})
test('旧SQLite只读迁移保留原题、收藏与零分历史，重开不会改变导出', async () => {
  const { DatabaseSync } = require('node:sqlite')
  const oldFile = path.join(directory, 'old-schema.sqlite')
  const db = new DatabaseSync(oldFile)
  db.exec(`CREATE TABLE questions(id TEXT PRIMARY KEY,categoryId TEXT NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,difficulty TEXT NOT NULL,type TEXT NOT NULL);
    CREATE TABLE favorites(questionId TEXT PRIMARY KEY,addedAt TEXT NOT NULL);
    CREATE TABLE history(submittedAt TEXT PRIMARY KEY,questionId TEXT NOT NULL,answer TEXT NOT NULL,score REAL,correctAnswer TEXT,feedback TEXT);`)
  const oldQuestion = q('old-sqlite')
  const oldRecord = { ...record, questionId: oldQuestion.id }
  const oldFavorite = { questionId: oldQuestion.id, addedAt: record.submittedAt }
  db.prepare('INSERT INTO questions VALUES(?,?,?,?,?,?)').run(
    ...['id', 'categoryId', 'title', 'content', 'difficulty', 'type'].map((key) => oldQuestion[key])
  )
  db.prepare('INSERT INTO favorites VALUES(?,?)').run(oldQuestion.id, oldFavorite.addedAt)
  db.prepare('INSERT INTO history VALUES(?,?,?,?,?,?)').run(
    ...['submittedAt', 'questionId', 'answer', 'score', 'correctAnswer', 'feedback'].map(
      (key) => oldRecord[key]
    )
  )
  db.close()
  const expected = { questions: [oldQuestion], favorites: [oldFavorite], history: [oldRecord] }
  const original = await fs.readFile(oldFile)
  const fixture = await createTemporaryDatabase()
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const store = createDataStore(fixture.config)
      try {
        await migrateLegacyData(store, oldFile)
        assert.deepEqual(await store.exportData(), expected)
        assert.equal(
          await store.isDuplicateQuestion('react', oldQuestion.title, oldQuestion.content),
          true
        )
      } finally {
        await store.close()
      }
    }
    assert.deepEqual(await fs.readFile(oldFile), original)
  } finally {
    await fixture.close()
  }
})
test('评分依据、建议、版本与模型重开后完整保留，分页仍只发摘要', async () => {
  const fullQuestion = require('./fixtures/grading').questions[0]
  const criteria = fullQuestion.rubric.map((point) => ({
    id: point.id,
    description: point.description,
    maxPoints: point.weight,
    points: 0,
    verdict: 'missed',
    evidence: '',
    explanation: '没有回答该项'
  }))
  const fullRecord = {
    ...record,
    questionId: fullQuestion.id,
    criteria,
    suggestions: ['补充明确要求'],
    uncertainties: [],
    topic: fullQuestion.topic,
    technicalVersion: fullQuestion.technicalVersion,
    promptVersion: 'evaluation-v2.0',
    questionPromptVersion: fullQuestion.promptVersion,
    model: 'test-model',
    referenceStatus: 'verified',
    sources: fullQuestion.sources
  }
  const fixture = await createTemporaryDatabase()
  const first = fixture.store
  try {
    await first.putQuestion(fullQuestion)
    await first.addHistory(fullRecord)
  } finally {
    await first.close()
  }
  const second = createDataStore(fixture.config)
  try {
    assert.deepEqual(await second.historyDetail(fullRecord.submittedAt), {
      question: fullQuestion,
      record: fullRecord
    })
    const page = await second.listHistory(1, 10)
    assert.equal(page.items[0].criteria, undefined)
    assert.equal(page.items[0].sources, undefined)
    assert.equal(page.items[0].score, 0)
  } finally {
    await second.close()
    await fixture.close()
  }
})
test('并发生成题在事务内查重，覆盖所有旧题而非最近标题窗口', async () => {
  const fixture = await createTemporaryDatabase()
  const store = fixture.store
  const independent = createDataStore(fixture.config)
  try {
    const first = q('dedup-1')
    const second = { ...first, id: 'dedup-2', title: '更换标题仍是同一题' }
    const results = await Promise.allSettled([
      store.putGeneratedQuestion(first),
      independent.putGeneratedQuestion(second)
    ])
    assert.equal(results.filter((x) => x.status === 'fulfilled').length, 1)
    assert.equal(results.find((x) => x.status === 'rejected').reason.status, 409)
    await Promise.all(
      Array.from({ length: 35 }, (_, i) =>
        store.putQuestion({
          ...q('other-' + i),
          content: '不同正文' + i,
          topic: 'Hooks',
          difficulty: 'easy'
        })
      )
    )
    const context = await store.generationContext('react')
    assert.equal(context.recent.length, 30)
    assert.equal(context.topics.find((x) => x.topic === 'Hooks').count, 35)
    assert.equal(context.difficulties.easy, 35)
    assert.equal(await store.isDuplicateQuestion('react', first.title, first.content), true)
    assert.equal((await store.summary()).counts.questions, 36)
  } finally {
    await independent.close()
    await fixture.close()
  }
})

test('MySQL完整保存中文emoji和长标题，查重沿用大小写与标点规范化规则', async () => {
  const fixture = await createTemporaryDatabase()
  const store = fixture.store
  try {
    const item = {
      ...q('unicode-😀'),
      title: '标题😀'.repeat(400),
      content: '中文代码😀'.repeat(1000),
      topic: '中文知识点😀'
    }
    await store.putQuestion(item)
    assert.deepEqual(await store.getQuestion(item.id), item)
    const first = { ...q('normalized'), title: 'React：useEffect！', content: '特殊正文' }
    await store.putGeneratedQuestion(first)
    assert.equal(await store.isDuplicateQuestion('react', ' REACT useEffect ', '另一段内容'), true)
  } finally {
    await fixture.close()
  }
})

test('导入缺失题目关联时回滚整批数据，不产生孤立收藏或历史', async () => {
  const fixture = await createTemporaryDatabase()
  try {
    await assert.rejects(
      fixture.store.importData({
        questions: [q('rollback')],
        favorites: [{ questionId: 'missing', addedAt: record.submittedAt }],
        history: []
      }),
      { status: 404 }
    )
    assert.deepEqual((await fixture.store.summary()).counts, {
      questions: 0,
      favorites: 0,
      history: 0
    })
    assert.equal(await fixture.store.migrationStatus('legacy_to_mysql_v1'), false)
  } finally {
    await fixture.close()
  }
})

test('不同时间格式按UTC时刻排序，API仍返回原始时间字符串', async () => {
  const fixture = await createTemporaryDatabase()
  try {
    await fixture.store.putQuestion(q('q1'))
    const older = { ...record, submittedAt: '2026-01-02T08:00:00+08:00' }
    const newer = { ...record, submittedAt: '2026-01-02T01:00:00.000Z' }
    await fixture.store.importData({ questions: [], favorites: [], history: [older, newer] })
    const page = await fixture.store.listHistory(1, 6)
    assert.deepEqual(
      page.items.map((item) => item.submittedAt),
      [newer.submittedAt, older.submittedAt]
    )
    assert.equal(
      (await fixture.store.historyDetail(older.submittedAt)).record.submittedAt,
      older.submittedAt
    )
  } finally {
    await fixture.close()
  }
})

test('迁移失败时数据与完成标记一起回滚，两个连接重复迁移只提交一次', async () => {
  const fixture = await createTemporaryDatabase()
  const independent = createDataStore(fixture.config)
  const name = 'test_atomic_migration'
  try {
    const broken = {
      questions: [q('migration')],
      favorites: [{ questionId: 'missing', addedAt: record.submittedAt }],
      history: []
    }
    await assert.rejects(fixture.store.migrateData(broken, name), { status: 404 })
    assert.equal(await fixture.store.migrationStatus(name), false)
    assert.equal((await fixture.store.summary()).counts.questions, 0)
    const valid = { ...broken, favorites: [] }
    const results = await Promise.all([
      fixture.store.migrateData(valid, name),
      independent.migrateData(valid, name)
    ])
    assert.deepEqual(results.map((result) => result.alreadyMigrated).sort(), [false, true])
    assert.equal((await fixture.store.summary()).counts.questions, 1)
  } finally {
    await independent.close()
    await fixture.close()
  }
})
