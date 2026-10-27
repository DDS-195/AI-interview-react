const { test } = require('node:test')
const assert = require('node:assert/strict')
const { catalog, canonicalCategoryId, topicEntries, MODES } = require('../data/topics')
const { makePlan, validateInput } = require('../services/questionPlan')

test('扩展目录的分类、知识点与覆盖配置都有有效唯一引用', () => {
  const categoryIds = catalog.categories.map((category) => category.id)
  assert.equal(new Set(categoryIds).size, categoryIds.length)
  const coreIds = catalog.groups.flatMap((group) => group.categories)
  assert.equal(new Set(coreIds).size, coreIds.length)
  const topics = new Set()
  for (const category of catalog.categories) {
    assert.equal(coreIds.includes(category.id), !category.optional)
    assert.ok(category.name.trim())
    const entries = topicEntries(category.id)
    assert.ok(entries.length)
    for (const topic of entries) {
      assert.ok(!topics.has(topic.id), topic.id)
      topics.add(topic.id)
      assert.ok(topic.name.trim() && topic.name.length <= 80, topic.id)
      assert.ok(topic.modes.includes('theory'), topic.id)
      assert.ok(
        topic.modes.every((mode) => MODES.includes(mode)),
        topic.id
      )
      assert.equal(new Set(topic.modes).size, topic.modes.length)
    }
  }
  for (const id of coreIds) {
    assert.ok(categoryIds.includes(id), id)
  }
  for (const [alias, target] of Object.entries(catalog.aliases)) {
    assert.ok(!categoryIds.includes(alias), alias)
    assert.ok(categoryIds.includes(target), target)
    assert.equal(canonicalCategoryId(alias), target)
  }
  for (const overrides of [catalog.topicModes, catalog.topicVersions, catalog.topicLanguages]) {
    for (const [id, value] of Object.entries(overrides)) {
      assert.ok(topics.has(id), id)
      assert.ok(value.length, id)
    }
  }
  for (const language of Object.values(catalog.topicLanguages)) {
    assert.ok(['javascript', 'typescript', 'html', 'css'].includes(language))
  }
})

test('固定新知识点时优先使用其API版本和代码语言，保留旧考点默认版本', async () => {
  const store = { generationContext: async () => ({ topics: [], recent: [], difficulties: {} }) }
  for (const [category, topicId, version, language] of [
    ['react', 'react:action-state', 'React 19', 'javascript'],
    ['react', 'react:effects', 'React 18', 'javascript'],
    ['vue', 'vue:watch-cleanup', 'Vue 3.5+', 'javascript'],
    ['ssr', 'ssr:next-cache', 'Next.js 15', 'javascript'],
    ['jquery', 'jquery:angular-forms', 'Angular 18', 'typescript'],
    ['html-css', 'html-css:dialog-popover', '现代浏览器', 'html'],
    ['nodejs', 'nodejs:sqlite', 'Node.js 24', 'javascript']
  ]) {
    const plan = await makePlan(store, validateInput({ category, topicId, mode: 'coding' }))
    assert.ok(plan.technicalVersion.includes(version), plan.technicalVersion)
    assert.equal(plan.codeLanguage, language)
    assert.equal(plan.topicId, topicId)
  }
})
