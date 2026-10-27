// 选题计划先确定考点、题型、难度与版本，再把明确范围交给 Prompt。
const {
  catalog,
  CATEGORIES,
  CATEGORY_NAMES,
  MODES,
  canonicalCategoryId,
  topicEntries,
  modeFor
} = require('../data/topics')
const { string, fail } = require('./aiContract')
const { factsFor } = require('../data/knowledge')
function versionFor(category, topicId) {
  return (
    catalog.topicVersions[topicId] ||
    CATEGORIES[canonicalCategoryId(category)]?.version ||
    '现代浏览器，ECMAScript 2023；涉及其他库时需明确版本'
  )
}
function languageFor(category, topicId) {
  return (
    catalog.topicLanguages[topicId] ||
    (category === 'typescript' ? 'typescript' : category === 'html-css' ? 'css' : 'javascript')
  )
}

// 在调用模型前拒绝非法范围，避免付费后才发现分类或题型不合法。
function validateInput(body) {
  if (!body || typeof body.category !== 'string' || !Object.hasOwn(CATEGORY_NAMES, body.category)) {
    fail('分类无效', 400)
  }
  const category = canonicalCategoryId(body.category)
  const titles = body.existingTitles ?? []
  if (!Array.isArray(titles) || titles.length > 200) {
    fail('旧题标题须为数组且不超过200项', 400)
  }
  titles.forEach((title) => string(title, '旧题标题', 2000, 400))
  if (body.difficulty !== undefined && !['easy', 'medium', 'hard'].includes(body.difficulty)) {
    fail('难度无效', 400)
  }
  if (body.mode !== undefined && !MODES.includes(body.mode)) {
    fail('练习模式无效', 400)
  }
  const mode = modeFor(category, body.mode)
  if (!MODES.includes(mode) || (['scenario', 'coding'].includes(category) && mode !== category)) {
    fail('练习模式无效', 400)
  }
  const topics = topicEntries(category)
  if (body.topicId !== undefined && !topics.some((topic) => topic.id === body.topicId)) {
    fail('知识点不属于当前分类', 400)
  }
  if (
    !topics.some(
      (topic) => (!body.topicId || topic.id === body.topicId) && topic.modes.includes(mode)
    )
  ) {
    fail('当前知识点不支持此练习模式', 400)
  }
  return {
    category,
    mode,
    topicId: body.topicId,
    existingTitles: titles,
    difficulty: body.difficulty
  }
}

// 优先避开最近考点，再考虑薄弱方向和使用次数；同优先级候选才随机。
async function makePlan(store, input, avoidTopic) {
  const context = await store.generationContext(input.category)
  const topics = topicEntries(input.category).filter(
    (topic) =>
      (!input.topicId || topic.id === input.topicId) &&
      topic.modes.includes(modeFor(input.category, input.mode))
  )
  if (!topics.length) {
    fail('当前范围没有适用的知识点', 400)
  }
  const usage = new Map(context.topics.map((item) => [item.topic, item.count]))
  const generatedCount = context.topics.reduce((sum, item) => sum + item.count, 0)
  // 显式指定考点时不改选；自动选题每三次留一次探索机会。
  const weakTopics =
    !input.topicId && generatedCount % 3 !== 2 && store.trainingContext
      ? await store.trainingContext(input.category)
      : []
  const weak = new Map(weakTopics.map((topic, index) => [topic.topicId, index]))
  const recent = new Set(context.recent.slice(0, 3).map((item) => item.topic))
  const ranked = topics
    .map((topic) => ({
      ...topic,
      used: usage.get(topic.name) || 0,
      recent: recent.has(topic.name) || topic.name === avoidTopic,
      priority: weak.has(topic.id) ? weak.get(topic.id) : 99
    }))
    .sort(
      (a, b) => Number(a.recent) - Number(b.recent) || a.priority - b.priority || a.used - b.used
    )
  const candidates = ranked.filter(
    (item) =>
      item.recent === ranked[0].recent &&
      item.priority === ranked[0].priority &&
      item.used === ranked[0].used
  )
  const selected = candidates[Math.floor(Math.random() * candidates.length)]
  const difficulty =
    input.difficulty ||
    ['easy', 'medium', 'hard'].reduce(
      (best, value) =>
        (context.difficulties[value] || 0) < (context.difficulties[best] || 0) ? value : best,
      'easy'
    )
  return {
    category: input.category,
    topic: selected.name,
    topicId: selected.id,
    mode: modeFor(input.category, input.mode),
    codeLanguage: languageFor(input.category, selected.id),
    difficulty,
    technicalVersion: versionFor(input.category, selected.id),
    existingTitles: [
      ...new Set([...context.recent.map((item) => item.title), ...input.existingTitles.slice(-20)])
    ].slice(0, 40),
    facts: factsFor({ topic: selected.name }).flatMap((card) => card.facts)
  }
}
module.exports = { validateInput, makePlan, versionFor }
