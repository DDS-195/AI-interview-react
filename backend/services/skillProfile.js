// 用不同题目的最近成绩汇总分类统计，样本数与分数一起返回。
const { canonicalCategoryId } = require('../data/topics')
const { createHash } = require('node:crypto')
const query = async (connection, sql, values = []) => (await connection.execute(sql, values))[0]
const questionFingerprint = (content) =>
  createHash('sha256').update(content.replace(/\r\n/g, '\n').trim()).digest('hex')
// 每个分类取不同题目的最近成绩；这只是练习统计，不额外调用AI推断能力。
function profile(rows, definitions) {
  const categories = definitions.map((category) => {
    const samples = rows.filter((row) => canonicalCategoryId(row.categoryId) === category.id)
    const distinct = [
      ...new Map(samples.map((row) => [questionFingerprint(row.content), row])).values()
    ]
    return {
      categoryId: category.id,
      categoryName: category.name,
      sampleSize: distinct.length,
      score: distinct.length
        ? Math.round((distinct.reduce((sum, row) => sum + row.score, 0) / distinct.length) * 10) /
          10
        : null
    }
  })
  return { version: 'skills-simple-v2', categories }
}
async function fromDatabase(connection, definitions) {
  const rows = await query(
    connection,
    `WITH latest AS (
    SELECT h.questionId,h.submittedOrderAt,h.rowId,h.score,h.details,
      ROW_NUMBER() OVER (PARTITION BY questionId ORDER BY submittedOrderAt DESC,rowId DESC) AS position
    FROM history h WHERE score IS NOT NULL)
    SELECT q.content,q.categoryId,h.score,h.details
    FROM latest h JOIN questions q ON q.id=h.questionId WHERE h.position=1 ORDER BY h.submittedOrderAt,h.rowId`
  )
  // 新记录使用作答时的题目快照；旧记录兼容现存题目，不推测缺失版本。
  return profile(
    rows.map((row) => {
      const details = typeof row.details === 'string' ? JSON.parse(row.details) : row.details || {}
      return {
        ...row,
        ...(details.questionSnapshot
          ? {
              categoryId: details.questionSnapshot.categoryId,
              content: details.questionSnapshot.content
            }
          : {})
      }
    }),
    definitions
  )
}
module.exports = { profile, fromDatabase, questionFingerprint }
