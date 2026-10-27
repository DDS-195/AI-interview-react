// SQL 负责题库、复习与练习统计；最近评分、首次评分和总作答次数采用不同口径。
const { catalog, canonicalCategoryId, topicEntries } = require('../data/topics')

const REVIEW_SCORE = 80
const query = async (connection, sql, values = []) => (await connection.execute(sql, values))[0]
// 仅用有评分的历史判断薄弱点；未评分记录仍计入作答次数，不覆盖最近成绩。

// ranked 取首末有效成绩，attempts 统计所有作答，library 再合成复习状态。
const learningCTE = `WITH ranked AS (
  SELECT questionId,submittedAt,submittedOrderAt,score,details,
    ROW_NUMBER() OVER (PARTITION BY questionId ORDER BY submittedOrderAt DESC,rowId DESC) AS newest,
    ROW_NUMBER() OVER (PARTITION BY questionId ORDER BY submittedOrderAt,rowId) AS oldest
  FROM history WHERE score IS NOT NULL
), attempts AS (
  SELECT questionId,COUNT(*) AS attempts,SUM(score IS NOT NULL) AS scoredAttempts,
    SUM(CASE WHEN score < ${REVIEW_SCORE} THEN 1 ELSE 0 END) AS lowAttempts
  FROM history GROUP BY questionId
), library AS (
  SELECT q.rowId,q.id,q.categoryId,q.title,LEFT(q.content,280) AS preview,q.difficulty,q.topic,
    JSON_UNQUOTE(JSON_EXTRACT(q.details,'$.topicId')) AS topicId,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(q.details,'$.mode')),
      CASE WHEN q.categoryId='scenario' THEN 'scenario' WHEN q.type='code' THEN 'coding' ELSE 'theory' END) AS mode,
    COALESCE(a.attempts,0) AS attempts,COALESCE(a.scoredAttempts,0) AS scoredAttempts,
    COALESCE(a.lowAttempts,0) AS lowAttempts,l.score AS latestScore,f.score AS firstScore,
    l.submittedAt AS latestSubmittedAt,l.details AS latestDetails,
    CASE
      WHEN r.status='pending' AND r.baselineSubmission <=> l.submittedAt THEN 'pending'
      WHEN r.status='completed' AND r.baselineSubmission <=> l.submittedAt THEN 'completed'
      WHEN l.score < ${REVIEW_SCORE} THEN 'pending'
      WHEN l.score >= ${REVIEW_SCORE} AND (a.lowAttempts>0 OR r.questionId IS NOT NULL) THEN 'completed'
      ELSE NULL END AS reviewStatus,
    CASE WHEN r.status='pending' AND r.baselineSubmission <=> l.submittedAt THEN 'manual' ELSE 'score' END AS reviewSource
  FROM questions q LEFT JOIN attempts a ON a.questionId=q.id
    LEFT JOIN ranked l ON l.questionId=q.id AND l.newest=1
    LEFT JOIN ranked f ON f.questionId=q.id AND f.oldest=1
    LEFT JOIN review_marks r ON r.questionId=q.id
)`

function categoryFilter(categoryId, column, values) {
  if (!categoryId) {
    return ''
  }
  const canonical = canonicalCategoryId(categoryId)
  const ids = [
    ...new Set([
      canonical,
      ...Object.keys(catalog.aliases).filter((id) => canonicalCategoryId(id) === canonical)
    ])
  ]
  values.push(...ids)
  return `${column} IN (${ids.map(() => '?').join(',')})`
}
function where(filters, reviews = false) {
  const values = []
  const conditions = []
  const category = categoryFilter(filters.categoryId, 'categoryId', values)
  if (category) {
    conditions.push(category)
  }
  if (filters.keyword) {
    // '=' 是显式转义符，用户输入的 %、_ 均按字面搜索。
    const pattern = `%${filters.keyword.replace(/[=%_]/g, (value) => '=' + value)}%`
    conditions.push(
      "(title COLLATE utf8mb4_0900_ai_ci LIKE ? ESCAPE '=' OR EXISTS (SELECT 1 FROM questions " +
        'searchQuestion WHERE searchQuestion.id=library.id AND searchQuestion.content COLLATE ' +
        "utf8mb4_0900_ai_ci LIKE ? ESCAPE '=') OR topic COLLATE utf8mb4_0900_ai_ci LIKE ? ESCAPE " +
        "'=')"
    )
    values.push(pattern, pattern, pattern)
  }
  if (filters.topicId) {
    const categoryId = filters.topicId.split(':')[0]
    const name =
      topicEntries(categoryId).find((topic) => topic.id === filters.topicId)?.name ||
      filters.topicId
    conditions.push('(topicId=? OR (topicId IS NULL AND topic=?))')
    values.push(filters.topicId, name)
  }
  for (const key of ['mode', 'difficulty']) {
    if (filters[key]) {
      conditions.push(`${key}=?`)
      values.push(filters[key])
    }
  }
  if (filters.practice) {
    conditions.push(filters.practice === 'practiced' ? 'attempts>0' : 'attempts=0')
  }
  if (reviews) {
    conditions.push('reviewStatus IS NOT NULL')
    if (filters.status !== 'all') {
      conditions.push('reviewStatus=?')
      values.push(filters.status || 'pending')
    }
  }
  return { sql: conditions.length ? ' WHERE ' + conditions.join(' AND ') : '', values }
}
function item(row) {
  const { rowId, latestDetails, lowAttempts, ...result } = row
  void rowId
  void lowAttempts
  for (const key of ['attempts', 'scoredAttempts']) {
    result[key] = Number(result[key])
  }
  result.improvement = result.scoredAttempts > 1 ? result.latestScore - result.firstScore : null
  const details = typeof latestDetails === 'string' ? JSON.parse(latestDetails) : latestDetails
  result.lossPoints = (details?.criteria || [])
    .filter((point) => point.points < point.maxPoints)
    .map(({ description, points, maxPoints, explanation }) => ({
      description,
      points,
      maxPoints,
      explanation
    }))
  return result
}
async function list(connection, filters, page, pageSize, reviews = false) {
  const condition = where(filters, reviews)
  const [count] = await query(
    connection,
    `${learningCTE} SELECT COUNT(*) AS total FROM library${condition.sql}`,
    condition.values
  )
  const total = Number(count.total)
  const actualPage = Math.min(page, Math.max(1, Math.ceil(total / pageSize)))
  const order = reviews
    ? 'CASE WHEN latestScore IS NULL THEN -1 ELSE latestScore END,rowId DESC'
    : 'rowId DESC'
  const rows = await query(
    connection,
    `${learningCTE} SELECT * FROM library${condition.sql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...condition.values, pageSize, (actualPage - 1) * pageSize]
  )
  return { items: rows.map(item), total, page: actualPage, pageSize, reviewThreshold: REVIEW_SCORE }
}

// 人工标记绑定当时最新成绩，新一次作答后会按新成绩重新判断复习状态。
async function markReview(connection, questionId, status) {
  const [exists] = await query(connection, 'SELECT id FROM questions WHERE id=? FOR UPDATE', [
    questionId
  ])
  if (!exists) {
    throw Object.assign(new Error('题目不存在或已删除'), { status: 404 })
  }
  if (status === 'reset') {
    await query(connection, 'DELETE FROM review_marks WHERE questionId=?', [questionId])
    return
  }
  const [latest] = await query(
    connection,
    'SELECT submittedAt FROM history WHERE questionId=? AND score IS NOT NULL ORDER BY ' +
      'submittedOrderAt DESC,rowId DESC LIMIT 1',
    [questionId]
  )
  await query(
    connection,
    `INSERT INTO review_marks (questionId,status,baselineSubmission,updatedAt) VALUES (?,?,?,UTC_TIMESTAMP(3))
    AS incoming ON DUPLICATE KEY UPDATE status=incoming.status,baselineSubmission=incoming.baselineSubmission,updatedAt=incoming.updatedAt`,
    [questionId, status, latest?.submittedAt || null]
  )
}

async function overview(connection, categoryId = '') {
  const values = []
  const condition = categoryFilter(categoryId, 'q.categoryId', values)
  const filter = condition ? ' WHERE ' + condition : ''
  const [totals] = await query(
    connection,
    `${learningCTE} SELECT COUNT(*) AS generatedQuestions,
    COALESCE(SUM(attempts>0),0) AS practicedQuestions,COALESCE(SUM(attempts),0) AS attempts,
    COALESCE(SUM(scoredAttempts),0) AS scoredAttempts,
    COALESCE(SUM(reviewStatus='pending'),0) AS pendingReviews,
    ROUND(AVG(latestScore),1) AS averageLatestScore FROM library q${filter}`,
    values
  )
  for (const key of Object.keys(totals)) {
    if (totals[key] !== null) {
      totals[key] = Number(totals[key])
    }
  }
  const [score] = await query(
    connection,
    `SELECT ROUND(AVG(h.score),1) AS averageScore,MAX(h.score) AS bestScore
    FROM history h JOIN questions q ON q.id=h.questionId${filter}`,
    values
  )
  const grouped = await query(
    connection,
    `${learningCTE} SELECT q.categoryId,q.topicId,q.topic,
    COUNT(*) AS generatedQuestions,SUM(q.attempts>0) AS practicedQuestions,SUM(q.attempts) AS attempts,
    SUM(q.scoredAttempts) AS scoredAttempts,SUM(q.reviewStatus='pending') AS pendingReviews,
    SUM(q.latestScore IS NOT NULL) AS scoreWeight,SUM(q.latestScore) AS scoreTotal
    FROM library q${filter} GROUP BY q.categoryId,q.topicId,q.topic`,
    values
  )
  const definitions = catalog.categories.filter(
    (category) => !categoryId || category.id === canonicalCategoryId(categoryId)
  )
  const categories = definitions.map((category) => {
    const topics = topicEntries(category.id).map((topic) => ({
      id: topic.id,
      name: topic.name,
      generatedQuestions: 0,
      practicedQuestions: 0,
      attempts: 0,
      scoredAttempts: 0,
      pendingReviews: 0,
      averageScore: null,
      scoreWeight: 0
    }))
    const rows = grouped.filter((row) => canonicalCategoryId(row.categoryId) === category.id)
    for (const row of rows) {
      const topic = topics.find(
        (topic) => topic.id === row.topicId || (!row.topicId && topic.name === row.topic)
      )
      if (!topic) {
        continue
      }
      for (const key of [
        'generatedQuestions',
        'practicedQuestions',
        'attempts',
        'scoredAttempts',
        'pendingReviews'
      ]) {
        topic[key] += Number(row[key] || 0)
      }
      if (Number(row.scoreWeight) > 0) {
        // 加权的是每题最近成绩；无评分题不参与均值。
        const weight = Number(row.scoreWeight)
        topic.averageScore =
          ((topic.averageScore || 0) * topic.scoreWeight + Number(row.scoreTotal)) /
          (topic.scoreWeight + weight)
        topic.scoreWeight += weight
      }
    }
    for (const topic of topics) {
      if (topic.averageScore !== null) {
        topic.averageScore = Math.round(topic.averageScore * 10) / 10
      }
      delete topic.scoreWeight
    }
    return {
      id: category.id,
      name: category.name,
      optional: Boolean(category.optional),
      generatedQuestions: rows.reduce((sum, row) => sum + Number(row.generatedQuestions), 0),
      practicedQuestions: rows.reduce((sum, row) => sum + Number(row.practicedQuestions), 0),
      coveredTopics: topics.filter((topic) => topic.practicedQuestions > 0).length,
      totalTopics: topics.length,
      topics
    }
  })
  const trend = await query(
    connection,
    `SELECT DATE(CONVERT_TZ(h.submittedOrderAt,'+00:00','+08:00')) AS date,
    COUNT(*) AS attempts,SUM(h.score IS NOT NULL) AS scoredAttempts,ROUND(AVG(h.score),1) AS averageScore
    FROM history h JOIN questions q ON q.id=h.questionId${filter}
    GROUP BY date ORDER BY date DESC LIMIT 14`,
    values
  )
  const modes = await query(
    connection,
    `SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(h.details,'$.mode')),
    JSON_UNQUOTE(JSON_EXTRACT(q.details,'$.mode')),CASE WHEN q.categoryId='scenario' THEN 'scenario' WHEN q.type='code' THEN 'coding' ELSE 'theory' END) AS mode,
    COUNT(*) AS attempts,ROUND(AVG(h.score),1) AS averageScore FROM history h JOIN questions q ON q.id=h.questionId${filter} GROUP BY mode`,
    values
  )
  return {
    totals: {
      ...totals,
      ...score,
      coveredTopics: categories.reduce((sum, category) => sum + category.coveredTopics, 0),
      totalTopics: categories.reduce((sum, category) => sum + category.totalTopics, 0)
    },
    categories,
    trend: trend.reverse().map((day) => ({
      ...day,
      attempts: Number(day.attempts),
      scoredAttempts: Number(day.scoredAttempts)
    })),
    modes: modes.map((mode) => ({ ...mode, attempts: Number(mode.attempts) })),
    weakTopics: categories
      .flatMap((category) =>
        category.topics
          .filter((topic) => topic.averageScore !== null && topic.averageScore < REVIEW_SCORE)
          .map((topic) => ({ ...topic, categoryId: category.id, categoryName: category.name }))
      )
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 8),
    skillProfile: await require('./skillProfile').fromDatabase(connection, definitions),
    reviewThreshold: REVIEW_SCORE,
    timeZone: 'Asia/Shanghai'
  }
}

async function trainingContext(connection, categoryId) {
  const values = []
  const condition = categoryFilter(categoryId, 'q.categoryId', values)
  const retrieved = await query(
    connection,
    `${learningCTE} SELECT q.id,q.topicId,q.topic,q.latestScore,original.content
    FROM library q JOIN questions original ON original.id=q.id WHERE ${condition} AND q.latestScore IS NOT NULL
    ORDER BY q.latestSubmittedAt,q.id`,
    values
  )
  const rows = [
    ...new Map(
      retrieved.map((row) => [require('./skillProfile').questionFingerprint(row.content), row])
    ).values()
  ]
  const groups = new Map()
  for (const row of rows) {
    const id = row.topicId || topicEntries(categoryId).find((topic) => topic.name === row.topic)?.id
    if (!id) {
      continue
    }
    if (!groups.has(id)) {
      groups.set(id, [])
    }
    groups.get(id).push(row.latestScore)
  }
  return [...groups]
    .map(([topicId, scores]) => ({
      topicId,
      sampleSize: scores.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }))
    .filter((topic) => topic.sampleSize >= 3 && topic.averageScore < REVIEW_SCORE)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 6)
}
module.exports = { list, markReview, overview, trainingContext, REVIEW_SCORE }
