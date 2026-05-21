const { getCategoryName, sampleTopics } = require('../data/topics')

function buildQuestionSystemPrompt() {
  return `你是一位资深前端架构师和面试官，拥有10年以上大厂面试经验。
你出的题目以精准、灵活、能考察真实理解深度而著称。

## 核心原则
- 问一句就能让候选人开始思考，不需要长篇铺垫
- 每个分类只出该分类范畴内的题，不要跨界
- 考察理解而非记忆

## 难度
easy: 基础概念，1-2年经验能答
medium: 综合分析，3-5年经验能答
hard: 深入原理，5年+经验能答好`
}

/**
 * 非流式 user prompt
 */
function buildQuestionUserPrompt(category, existingTitles) {
  const categoryName = getCategoryName(category)
  const topics = sampleTopics(category, 4)
  const existing = existingTitles.length > 0
    ? existingTitles.slice(0, 6).map((t, i) => `${i + 1}. ${t}`).join('\n')
    : '（第一道题，自由发挥）'

  return `请为「${categoryName}」分类生成一道面试题。

已出过（请严格避免重复）：
${existing}

可选知识点：${topics.join('、')}

出题要求：
- 标题：10-20字，简洁有力
- 题目描述：1-2句话，像面试官口头提问一样自然简短
- 难度从 easy/medium/hard 随机选择
- 不要"请解释""请描述""请列举"等模板化开头
- 绝对不要包含代码块、代码示例

直接输出题目，格式：
第一行 - 标题
后续行 - 简短题目描述
最后行 - {"difficulty":"easy/medium/hard","topic":"知识点"}`
}

/**
 * 流式 prompt — 严格区分 coding 和非 coding
 */
function buildStreamQuestionPrompt(category, existingTitles) {
  const categoryName = getCategoryName(category)
  const topics = sampleTopics(category, 4)
  const existing = existingTitles.length > 0
    ? `已出过：${existingTitles.slice(0, 5).join('、')}`
    : ''

  const isCoding = category === 'coding'

  const systemPrompt = isCoding
    ? `你是资深前端面试官，专门出手写代码题。要求候选人手写实现函数或算法。难度随机easy/medium/hard。`
    : `你是资深前端面试官。提问极其简洁：一行标题，一行问题。禁止场景铺垫，禁止代码，禁止多余解释。`

  const codingPrompt = [
    `请为「${categoryName}」分类生成一道手写代码题。`,
    existing ? `注意：${existing} —— 严格避免重复。` : '',
    `建议知识点：${topics.join('、')}`,
    '',
    '要求：',
    '第一行：题目标题（10-20字）',
    '第二行开始：题目要求（描述要实现什么函数、输入输出、限制条件）',
    '可包含简短示例输入输出。',
    '【单独一行】{"difficulty":"easy/medium/hard","topic":"知识点"}',
    '',
    '直接输出，不用代码块包裹。'
  ].filter(Boolean).join('\n')

  const nonCodingPrompt = [
    `请为「${categoryName}」分类生成一道面试题。`,
    existing ? `注意：${existing} —— 严格避免重复。` : '',
    `参考知识点：${topics.join('、')}`,
    '',
    '必须遵守（违反则不合格）：',
    '1. 第一行是标题，10-20字',
    '2. 第二行是题目——最多两句话，像面试官随口一问',
    '3. 禁止输出任何形式的代码（代码块、行内代码、示例代码都不行）',
    '4. 禁止"请解释""请描述""请列举""请谈谈"等模板化套话',
    '5. 禁止写场景铺垫——直接问问题本身',
    '6. 最后【单独一行】输出，不要拼在题目文本后面：{"difficulty":"easy/medium/hard","topic":"知识点"}',
    '',
    '直接输出，不用代码块包裹。'
  ].filter(Boolean).join('\n')

  const userPrompt = isCoding ? codingPrompt : nonCodingPrompt

  return { systemPrompt, userPrompt }
}

module.exports = {
  buildQuestionSystemPrompt,
  buildQuestionUserPrompt,
  buildStreamQuestionPrompt
}
