const { getCategoryName, sampleTopics } = require('../data/topics')

function buildQuestionSystemPrompt() {
  return `你是一位资深前端架构师和面试官，拥有10年以上大厂面试经验。
你出的题目以精准、灵活、能考察真实理解深度而著称。

## ⚠️ 严格约束

1. 只出该分类范畴内的题，不要跨界。不要出一道题需要用到其他分类的知识才能完整回答
2. 题目考察的是理解，不是记忆。不要问"请列举XX的五种方法"这类背诵题
3. 题目必须是前端面试真实会问的题，不要出偏门冷门的知识点
4. 不要造概念、造术语、造不存在的 API 或特性

## 核心原则
- 问一句就能让候选人开始思考，不需要长篇铺垫
- 好的题目：候选人知道概念就能答出方向，但要答好需要理解深度
- 题目本身就应该暗示考点，不要让人猜"你到底想问什么"

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
- 题目描述：像面试官口头提问，直接进入问题本身。不要"请解释""请描述""请列举"等开头
- 如果你用了知识点列表中的某个概念，题目应该引导候选人展示理解，而不是让他背诵定义
- 难度从 easy/medium/hard 随机选择
- 不要包含代码块

以下是好的出题示例（TypeScript分类）：
> "type 和 interface 的区别是什么？什么时候用哪个？"

直接输出，格式：
第一行 - 标题
后续行 - 题目描述
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
    ? `你是资深前端面试官，专门出手写代码题。

## ⚠️ 严格约束
1. 题目只能考察前端相关的手写实现，不要出算法题（如排序、动态规划、二叉树遍历等），那不是前端面试的重点
2. 题目必须是候选人10-15分钟内能写完的，不要出需要几十行代码才能搞定的大工程
3. 需求描述必须明确：入参是什么、返回值是什么、边界条件是什么
4. 不要出依赖第三方库的题，考察的是原生 JavaScript/前端 API 的掌握

## 好的手写题长这样
以"手写防抖 debounce"为例：
- 需求清楚：实现一个 debounce(fn, delay) 函数，返回一个新函数，在 delay 毫秒内重复调用只执行最后一次
- 有示例：debounce(fn, 300) 被连续调用三次，fn 只在最后一次调用后 300ms 执行一次
- 有区分度：基础写出来就行，高阶会考虑 this 绑定、参数透传、立即执行选项、取消防抖
- 考察的是候选人是否真正理解原理，而不是死记硬背代码`
    : `你是资深前端面试官。提问简洁直接，像面试官随口一问。好的面试题：读完就知道问什么，但答好需要深度。禁止啰嗦铺垫，禁止代码，禁止"请解释""请列举"等开头。`

  const codingPrompt = [
    `请为「${categoryName}」分类生成一道手写代码题。`,
    existing ? `注意：${existing} —— 严格避免重复。` : '',
    `建议知识点：${topics.join('、')}`,
    '',
    '要求：',
    '1. 第一行：题目标题（10-20字），如"手写防抖 debounce"',
    '2. 第二行开始：需求描述，说清楚实现什么函数、入参出参、行为要求',
    '3. 附带1-2个简短的输入输出示例，帮助候选人理解预期行为',
    '4. 可以提1-2个进阶要求（如处理this指向、支持取消、处理边界情况），但基础实现应该是大部分候选人能写出来的',
    '5. 题目难度要合理：easy是手写节流/去重，medium是手写Promise.all/debounce，hard是手写Promise/深拷贝',
    '6. 【单独一行】{"difficulty":"easy/medium/hard","topic":"知识点"}',
    '',
    '直接输出，不用代码块包裹。'
  ].filter(Boolean).join('\n')

  const nonCodingPrompt = [
    `请为「${categoryName}」分类生成一道面试题。`,
    existing ? `注意：${existing} —— 严格避免重复。` : '',
    `参考知识点：${topics.join('、')}`,
    '',
    '要求：',
    '1. 第一行：标题，10-20字',
    '2. 第二行：题目——像面试官随口一问，读完就知道要回答什么',
    '3. 禁止啰嗦铺垫、场景描写、代码示例、模板式开头',
    '4. 好题目示例（TypeScript分类）："type 和 interface 的区别是什么？什么时候用哪个？"',
    '5. 最后【单独一行】：{"difficulty":"easy/medium/hard","topic":"知识点"}',
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
