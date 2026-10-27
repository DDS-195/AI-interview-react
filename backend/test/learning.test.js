const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createTemporaryDatabase } = require('../database/temporaryDatabase')
const { createDataStore } = require('../services/dataStore')
const { createApp } = require('../app')
const { topicEntries } = require('../data/topics')
const q = (id, extras = {}) => ({
  id,
  categoryId: 'react',
  title: `React 题目 ${id}`,
  content: '解释 React 状态更新',
  difficulty: 'medium',
  type: 'text',
  ...extras
})
const h = (questionId, day, score, extras = {}) => ({
  questionId,
  submittedAt: `2026-01-${String(day).padStart(2, '0')}T00:00:00.000Z`,
  answer: '测试回答',
  ...(score === undefined ? {} : { score }),
  ...extras
})
async function fixture(operation) {
  const database = await createTemporaryDatabase()
  const server = createApp({ dataStore: database.store }).listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  async function api(path, method = 'GET', body, status = 200) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/data${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    })
    const data = await response.json()
    assert.equal(response.status, status, JSON.stringify(data))
    return data
  }
  try {
    await operation(database, api)
  } finally {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
    await database.close()
  }
}

test('题库分页与组合筛选使用实际MySQL，兼容旧题型、别名及知识点', () =>
  fixture(async ({ store }, api) => {
    const topic = topicEntries('react')[0]
    await store.importData({
      questions: [
        q('a', { topicId: topic.id, topic: topic.name, mode: 'debug', difficulty: 'hard' }),
        q('b', { topic: topic.name }),
        q('c', { type: 'code' }),
        q('legacy', { categoryId: 'es6' }),
        q('scenario', { categoryId: 'scenario' })
      ],
      favorites: [],
      history: [h('a', 1, 0)]
    })
    const filtered = await api(
      `/questions?${new URLSearchParams({ categoryId: 'react', topicId: topic.id, mode: 'debug', difficulty: 'hard', practice: 'practiced' })}`
    )
    assert.deepEqual(
      filtered.items.map((item) => item.id),
      ['a']
    )
    assert.equal(filtered.items[0].latestScore, 0)
    assert.equal(filtered.items[0].reviewStatus, 'pending')
    assert.equal(filtered.items[0].content, undefined)
    assert.equal((await api(`/questions?topicId=${encodeURIComponent(topic.id)}`)).total, 2)
    assert.deepEqual(
      (await api('/questions?categoryId=javascript')).items.map((item) => item.id),
      ['legacy']
    )
    assert.equal((await api('/questions?mode=coding')).total, 1)
    assert.equal((await api('/questions?mode=scenario')).total, 1)
    const last = await api('/questions?page=99&pageSize=2')
    assert.equal(last.page, 3)
    assert.equal(last.items.length, 1)
    assert.equal((await api('/questions?practice=unpracticed')).total, 4)
    await api('/questions?mode=invalid', 'GET', undefined, 400)
    await api('/reviews?status=invalid', 'GET', undefined, 400)
    await api('/questions?keyword[x]=bad', 'GET', undefined, 400)
    await api('/questions?pageSize=101', 'GET', undefined, 400)
    await api('/reviews/missing', 'PUT', { status: 'pending' }, 404)
    await api('/reviews/a', 'PUT', { status: 'bad' }, 400)
  }))

test('搜索覆盖完整正文、大小写和字面通配符，输入不会改变SQL范围', () =>
  fixture(async ({ store }, api) => {
    await store.importData({
      questions: [
        q('wild', { title: 'React 100%_=' }),
        q('tail', { content: '正文'.repeat(300) + '尾部专属关键词' })
      ],
      favorites: [],
      history: []
    })
    for (const keyword of ['100%_=', 'react 100', '尾部专属关键词']) {
      const result = await api('/questions?' + new URLSearchParams({ keyword }))
      assert.equal(result.total, 1)
    }
    assert.equal(
      (await api('/questions?' + new URLSearchParams({ keyword: "' OR 1=1 --" }))).total,
      0
    )
  }))

test('自动错题、人工完成、新低分重新进入复习与重练进步保持一致', () =>
  fixture(async ({ store }, api) => {
    await store.putQuestion(q('low'))
    await store.addHistory(
      h('low', 1, 0, {
        criteria: [
          {
            id: 'p1',
            description: '状态更新原理',
            maxPoints: 100,
            points: 0,
            verdict: 'missed',
            evidence: '',
            explanation: '未说明原理'
          }
        ]
      })
    )
    let result = await api('/reviews')
    assert.equal(result.total, 1)
    assert.equal(result.items[0].lossPoints[0].description, '状态更新原理')
    await api('/reviews/low', 'PUT', { status: 'completed' })
    assert.equal((await api('/reviews')).total, 0)
    assert.equal((await api('/reviews?status=completed')).total, 1)
    await store.addHistory(h('low', 2, undefined))
    assert.equal((await api('/reviews')).total, 0)
    await store.addHistory(h('low', 3, 70))
    result = await api('/reviews')
    assert.equal(result.total, 1)
    assert.equal(result.items[0].improvement, 70)
    assert.equal(result.items[0].attempts, 3)
    assert.equal(result.items[0].scoredAttempts, 2)
    await store.addHistory(h('low', 4, 80))
    assert.equal((await api('/reviews')).total, 0)
    result = await api('/reviews?status=completed')
    assert.equal(result.items[0].improvement, 80)
    await api('/reviews/low', 'PUT', { status: 'pending' })
    assert.equal((await api('/reviews')).items[0].reviewSource, 'manual')
    await store.addHistory(h('low', 5, 85))
    assert.equal((await api('/reviews')).total, 0)
    await store.addHistory(h('low', 6, 10))
    assert.equal((await api('/reviews')).total, 1)
    await store.deleteHistory(h('low', 6, 10).submittedAt)
    assert.equal((await api('/reviews')).total, 0)
  }))

test('未作答题可手动复习，标记能跨连接恢复并随导出导入保留', () =>
  fixture(async (database, api) => {
    await database.store.putQuestion(q('manual'))
    await api('/reviews/manual', 'PUT', { status: 'pending' })
    const independent = createDataStore(database.config)
    try {
      assert.equal((await independent.listReviews({ status: 'pending' }, 1, 8)).total, 1)
      const exported = await independent.exportData()
      assert.equal(exported.reviewMarks[0].baselineSubmission, null)
      await api('/reviews/manual', 'PUT', { status: 'reset' })
      assert.equal((await api('/reviews')).total, 0)
      await independent.importData(exported)
      assert.equal((await api('/reviews')).total, 1)
      assert.deepEqual((await independent.exportData()).reviewMarks, exported.reviewMarks)
      await api('/reviews/manual', 'PUT', { status: 'completed' })
      assert.equal((await api('/reviews?status=completed')).total, 1)
      await api(
        '/import',
        'POST',
        {
          questions: [q('rollback')],
          favorites: [],
          history: [],
          reviewMarks: [{ ...exported.reviewMarks[0], questionId: 'missing' }]
        },
        404
      )
      assert.equal(await independent.getQuestion('rollback'), null)
    } finally {
      await independent.close()
    }
  }))

test('学习统计区分生成与作答、去重覆盖、最近成绩和所有作答均值', () =>
  fixture(async ({ store }, api) => {
    const [first, second] = topicEntries('react')
    await store.importData({
      questions: [
        q('a', { topicId: first.id, topic: first.name }),
        q('b', { topic: first.name }),
        q('generated', { topicId: second.id, topic: second.name }),
        q('unclassified')
      ],
      favorites: [],
      history: [h('a', 1, 0), h('a', 2, 100), h('b', 3, 40), h('unclassified', 4, undefined)]
    })
    const result = await api('/learning?categoryId=react')
    assert.deepEqual(result.totals, {
      generatedQuestions: 4,
      practicedQuestions: 3,
      attempts: 4,
      scoredAttempts: 3,
      pendingReviews: 1,
      averageLatestScore: 70,
      averageScore: 46.7,
      bestScore: 100,
      coveredTopics: 1,
      totalTopics: topicEntries('react').length
    })
    assert.equal(result.weakTopics.length, 1)
    assert.equal(result.weakTopics[0].averageScore, 70)
    assert.equal(result.weakTopics[0].practicedQuestions, 2)
    assert.equal(result.trend[0].averageScore, 0)
    assert.equal(result.trend[3].averageScore, null)
    assert.equal(result.modes.find((item) => item.mode === 'theory').attempts, 4)
    await store.clearHistory()
    const empty = await api('/learning?categoryId=react')
    assert.equal(empty.totals.practicedQuestions, 0)
    assert.equal(empty.totals.coveredTopics, 0)
    assert.equal(empty.totals.averageScore, null)
    assert.deepEqual(empty.trend, [])
  }))

test('北京时间趋势合并跨UTC日期的同一天，旧分类映射到对应领域', () =>
  fixture(async ({ store }, api) => {
    await store.importData({
      questions: [q('alias', { categoryId: 'es6' })],
      favorites: [],
      history: [h('alias', 1, 20, { submittedAt: '2026-01-01T20:00:00.000Z' }), h('alias', 2, 80)]
    })
    const result = await api('/learning?categoryId=javascript')
    assert.equal(result.totals.generatedQuestions, 1)
    assert.deepEqual(result.trend, [
      { date: '2026-01-02', attempts: 2, scoredAttempts: 2, averageScore: 50 }
    ])
  }))
