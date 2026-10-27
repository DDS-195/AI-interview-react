// 收敛列表筛选和复习状态输入，SQL 只使用通过校验的业务条件。
const { text } = require('./dataValidation')
const { MODES } = require('../data/topics')

function invalid(message) {
  throw Object.assign(new Error(message), { status: 400 })
}
function optional(value, name, max) {
  if (value === undefined || value === '') {
    return ''
  }
  return text(value, name, max).trim()
}
function choice(value, values, name, fallback = '') {
  const result = optional(value, name, 40) || fallback
  if (result && !values.includes(result)) {
    invalid(`${name}无效`)
  }
  return result
}
function filters(query, reviews = false) {
  return {
    keyword: optional(query.keyword, '搜索关键词', 100),
    categoryId: optional(query.categoryId, '分类', 100),
    topicId: optional(query.topicId, '知识点', 300),
    mode: choice(query.mode, MODES, '题型'),
    difficulty: choice(query.difficulty, ['easy', 'medium', 'hard'], '难度'),
    practice: choice(query.practice, ['unpracticed', 'practiced'], '练习状态'),
    ...(reviews
      ? { status: choice(query.status, ['pending', 'completed', 'all'], '复习状态', 'pending') }
      : {})
  }
}
function reviewAction(value) {
  return choice(value, ['pending', 'completed', 'reset'], '复习操作') || invalid('请指定复习操作')
}

module.exports = { filters, reviewAction, optional }
