// 后端读取共享分类目录；题型和技术版本由计划层进一步约束。
// 前后端共享注册表；历史分类保持读取兼容。
const catalog = require('../../shared/catalog.json')
const CATEGORIES = Object.fromEntries(catalog.categories.map((category) => [category.id, category]))
const CATEGORY_NAMES = {
  ...catalog.legacyNames,
  ...Object.fromEntries(catalog.categories.map((category) => [category.id, category.name]))
}
const TOPICS = {
  ...catalog.legacyTopics,
  ...Object.fromEntries(
    catalog.categories.map((category) => [category.id, Object.values(category.topics)])
  )
}
const MODES = catalog.modes.map((mode) => mode.id)
function canonicalCategoryId(id) {
  return Object.hasOwn(catalog.aliases, id) ? catalog.aliases[id] : id
}
function getCategoryName(id) {
  return CATEGORY_NAMES[id] || id
}
function topicEntries(category) {
  const definition = CATEGORIES[canonicalCategoryId(category)]
  return definition
    ? Object.entries(definition.topics).map(([key, name]) => {
        const id = `${definition.id}:${key}`
        return { id, name, modes: catalog.topicModes[id] || catalog.defaultModes }
      })
    : (TOPICS[category] || []).map((name, index) => ({
        id: `${category}:legacy-${index}`,
        name,
        modes: [modeFor(category)]
      }))
}
function getTopics(category) {
  return topicEntries(category).map((topic) => topic.name)
}
function modeFor(category, mode) {
  return mode || (['scenario', 'coding'].includes(category) ? category : 'theory')
}
module.exports = {
  catalog,
  CATEGORIES,
  CATEGORY_NAMES,
  TOPICS,
  MODES,
  canonicalCategoryId,
  getCategoryName,
  topicEntries,
  getTopics,
  modeFor
}
