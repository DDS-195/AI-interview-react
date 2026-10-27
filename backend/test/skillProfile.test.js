const { test } = require('node:test')
const assert = require('node:assert/strict')
const { profile } = require('../services/skillProfile')
const { makePlan } = require('../services/questionPlan')
test('分类成绩区分无样本与零分，重复题干只取最近成绩', () => {
  const row = {
    categoryId: 'react',
    content: '题目正文',
    score: 0,
    topicId: 'react:effects',
    difficulty: 'easy',
    type: 'text',
    details: {}
  }
  const result = profile(
    [
      row,
      { ...row, content: ' 题目正文\n', score: 40 },
      {
        ...row,
        content: '另一个问题',
        score: 80,
        difficulty: 'hard',
        details: {
          mode: 'coding',
          technicalVersion: 'React 19',
          referenceStatus: 'grounded',
          knowledgeSnapshot: { method: 'hybrid' }
        }
      }
    ],
    [
      { id: 'react', name: 'React' },
      { id: 'vue', name: 'Vue' }
    ]
  )
  assert.equal(result.categories[0].sampleSize, 2)
  assert.equal(result.categories[0].score, 60)
  assert.equal(result.categories[1].score, null)
  assert.equal(result.categories[1].sampleSize, 0)
  assert.equal(profile([row], [{ id: 'react', name: 'React' }]).categories[0].score, 0)
})
test('自动训练优先已有足量低分样本，指定考点优先，每三题保留一次探索', async () => {
  const store = {
    generationContext: async () => ({ topics: [], recent: [], difficulties: {} }),
    trainingContext: async () => [{ topicId: 'react:effects', sampleSize: 3, averageScore: 40 }]
  }
  const plan = await makePlan(store, { category: 'react', mode: 'theory', existingTitles: [] })
  assert.equal(plan.topicId, 'react:effects')
  assert.equal(
    (
      await makePlan(store, {
        category: 'react',
        topicId: 'react:state',
        mode: 'theory',
        existingTitles: []
      })
    ).topicId,
    'react:state'
  )
  let calls = 0
  store.trainingContext = async () => {
    calls++
    return []
  }
  store.generationContext = async () => ({
    topics: [{ topic: 'useEffect副作用与清理', count: 2 }],
    recent: [],
    difficulties: {}
  })
  await makePlan(store, { category: 'react', mode: 'theory', existingTitles: [] })
  assert.equal(calls, 0)
})
