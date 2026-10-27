// 知识导入和检索共用分类、来源与字段约束，原文中的代码不会被执行。
const { createHash } = require('node:crypto')
const { text } = require('../dataValidation')
const { canonicalCategoryId, topicEntries, MODES } = require('../../data/topics')

const hash = (value) => createHash('sha256').update(value).digest('hex')
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status })
}
function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('知识数据格式无效')
  }
}
function topics(categoryId, ids) {
  const entries = topicEntries(categoryId)
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > 12 ||
    ids.some((id) => !entries.some((topic) => topic.id === id))
  ) {
    fail('请选择当前分类的有效知识点')
  }
  return [...new Set(ids)].sort()
}
function document(value) {
  object(value)
  const title = text(value.title, '知识标题', 200).trim()
  const categoryId = canonicalCategoryId(text(value.categoryId, '分类', 100))
  const topicIds = topics(categoryId, value.topicIds)
  const sourceUrl = text(value.sourceUrl, '来源链接', 1000).trim()
  try {
    if (new URL(sourceUrl).protocol !== 'https:') {
      fail('来源须为HTTPS链接')
    }
  } catch {
    fail('来源须为HTTPS链接')
  }
  const content = text(value.content, '知识正文', 60000).replace(/\r\n/g, '\n').trim()
  const technicalVersion = text(value.technicalVersion, '技术版本', 200).trim()
  if (
    !['concept', 'interview_qa', 'misconception', 'answer_example', 'rubric_template'].includes(
      value.kind
    )
  ) {
    fail('知识类型无效')
  }
  const sourceKind = value.sourceKind || 'curated'
  if (!['official', 'curated', 'experience'].includes(sourceKind)) {
    fail('来源类型无效')
  }
  const modes = value.modes || MODES
  if (!Array.isArray(modes) || !modes.length || modes.some((mode) => !MODES.includes(mode))) {
    fail('适用题型无效')
  }
  const aliases = value.aliases || []
  if (!Array.isArray(aliases) || aliases.length > 20) {
    fail('关键词格式无效')
  }
  const metadata = {
    categoryId,
    topicIds,
    technicalVersion,
    kind: value.kind,
    modes: [...new Set(modes)].sort(),
    aliases: aliases.map((alias) => text(alias, '关键词', 100)),
    licenseNote:
      value.licenseNote === undefined
        ? '原创整理，来源用于核对'
        : text(value.licenseNote, '授权说明', 300)
  }
  const sourceKey = hash(
    value.sourceKey === undefined ||
      (typeof value.sourceKey === 'string' && !value.sourceKey.trim())
      ? sourceUrl + '\n' + title
      : text(value.sourceKey, '来源标识', 300)
  )
  return {
    title,
    sourceUrl,
    sourceKind,
    content,
    metadata,
    sourceKey,
    contentHash: hash(JSON.stringify({ title, sourceUrl, sourceKind, content, metadata }))
  }
}
function search(value) {
  object(value)
  const categoryId = canonicalCategoryId(text(value.categoryId, '分类', 100))
  const topicId = text(value.topicId, '知识点', 300)
  topics(categoryId, [topicId])
  const result = { categoryId, topicId, query: text(value.query, '检索内容', 1000).trim() }
  if (value.technicalVersion !== undefined) {
    result.technicalVersion = text(value.technicalVersion, '技术版本', 200)
  }
  if (value.mode !== undefined) {
    if (!MODES.includes(value.mode)) {
      fail('适用题型无效')
    }
    result.mode = value.mode
  }
  return result
}
module.exports = { document, search, hash, fail }
