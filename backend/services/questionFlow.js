// 出题流程串联选题、知识检索、模型、契约和保存，流式预览不代表生成成功。
const { randomUUID } = require('node:crypto')
const { StringDecoder } = require('node:string_decoder')
const { callAI, callAIStream } = require('./aiService')
const {
  fail,
  string,
  strings,
  rubric,
  parseJSON,
  titleKey,
  partialString
} = require('./aiContract')
const { question: normalizeQuestion } = require('./dataValidation')
const { makePlan, versionFor } = require('./questionPlan')
const { modeFor } = require('../data/topics')
const { referenceFor, factsFor, verifiedRubric } = require('../data/knowledge')
const {
  buildStreamQuestionPrompt,
  buildRubricPrompt,
  questionContentLimit,
  QUESTION_PROMPT_VERSION,
  RUBRIC_PROMPT_VERSION
} = require('../prompts/questionPrompts')

// 完整输出通过契约后才能生成可保存的题目，预览阶段不执行这一步。
function completeQuestion(value, plan, model, knowledgeSnapshot) {
  const title = string(value?.title, '题目标题', 80)
  const content = string(value?.content, '题目正文', 5000)
  const mode = modeFor(plan.category, plan.mode)
  if (Array.from(content).length > questionContentLimit(mode)) {
    fail(
      `题干过长，请压缩为一个核心问题，最多${questionContentLimit(mode)}字符，保留必要条件并同步收窄评分项`
    )
  }
  if (
    titleKey(title) === titleKey(content) ||
    /^(抱歉|对不起|无法生成|不能提供)/.test(title + content)
  ) {
    fail('AI 未生成有效题目')
  }
  if (value.difficulty !== plan.difficulty || value.topic !== plan.topic) {
    fail('题目难度或主考点不符合要求')
  }
  const points = rubric(value.rubric)
  const optionalPoints = strings(value.optionalPoints, '可选拓展')
  if (
    optionalPoints.some((optional) =>
      points.some((point) => titleKey(optional) === titleKey(point.description))
    )
  ) {
    fail('必要要求与可选要求重复')
  }
  const q = {
    id: `ai-${randomUUID()}`,
    categoryId: plan.category,
    title,
    content,
    difficulty: plan.difficulty,
    type: mode === 'coding' ? 'code' : 'text',
    mode,
    topicId: plan.topicId,
    codeLanguage: plan.codeLanguage,
    topic: plan.topic,
    technicalVersion: plan.technicalVersion,
    rubric: points,
    optionalPoints,
    referenceAnswer: string(value.referenceAnswer, '参考要点', 10000),
    promptVersion: QUESTION_PROMPT_VERSION,
    model
  }
  if (knowledgeSnapshot) {
    q.knowledgeSnapshot = knowledgeSnapshot
  }
  if (knowledgeSnapshot?.status === 'grounded') {
    try {
      q.rubricSources = require('./knowledge/snapshot').validateBindings(
        value.rubricSources,
        points.map((point) => point.id),
        knowledgeSnapshot
      )
    } catch (error) {
      // 模型漏字段属于上游格式错误，沿用已有的一次修复；不能当成用户输入错误直接结束。
      fail(error.message)
    }
    q.referenceStatus = 'grounded'
    q.sources = [
      ...new Map(
        knowledgeSnapshot.evidence.map((item) => [item.url, { title: item.title, url: item.url }])
      ).values()
    ]
  } else {
    Object.assign(q, referenceFor(q))
  }
  return normalizeQuestion(q)
}

// 将供应商的增量 JSON 流转换为题目预览，并独立验证结束原因。
async function consumeStream(stream, onPreview, signal) {
  const abort = () => stream.destroy()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) {
    abort()
  }
  const decoder = new StringDecoder('utf8')
  let buffer = ''
  let content = ''
  let finishReason = ''
  let model = ''
  let preview = ''
  function line(raw) {
    if (!raw.startsWith('data:')) {
      return
    }
    const text = raw.slice(5).trim()
    if (!text || text === '[DONE]') {
      return
    }
    const event = parseJSON(text)
    if (event.error) {
      fail('AI 上游返回错误，请重试')
    }
    const choice = event.choices?.[0]
    model = event.model || model
    if (choice?.finish_reason) {
      finishReason = choice.finish_reason
      if (finishReason !== 'stop') {
        fail(finishReason === 'length' ? 'AI 输出达到长度上限，请重试' : 'AI 输出未正常完成')
      }
    }
    if (choice?.delta?.content !== undefined && typeof choice.delta.content !== 'string') {
      fail('AI 流式内容格式无效')
    }
    content += choice?.delta?.content || ''
    if (content.length > 30000) {
      fail('AI 输出超长，请重试')
    }
    const title = partialString(content, 'title')
    const body = partialString(content, 'content')
    const next = title + (body ? '\n' + body : '')
    if (next !== preview) {
      preview = next
      onPreview?.(preview)
    }
  }
  try {
    for await (const chunk of stream) {
      if (signal?.aborted) {
        throw new Error('请求已取消')
      }
      buffer += Buffer.isBuffer(chunk) ? decoder.write(chunk) : chunk
      if (buffer.length > 65536) {
        fail('AI 流式消息超长，请重试')
      }
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const raw of lines) {
        line(raw)
      }
    }
  } finally {
    signal?.removeEventListener('abort', abort)
  }
  buffer += decoder.end()
  if (buffer.trim()) {
    line(buffer)
  }
  if (finishReason !== 'stop') {
    fail('题目生成中断，请重新生成')
  }
  return { content, model: model || process.env.AI_MODEL || 'unknown' }
}

// 总截止时间覆盖检索、模型和格式修复；最多尝试两次，保存失败不重做模型。
async function generateQuestion(
  store,
  input,
  { stream = false, onPreview, signal, knowledgeService } = {}
) {
  signal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(110000)])
    : AbortSignal.timeout(110000)
  let reason = ''
  let avoidTopic
  for (let attempt = 0; attempt < 2; attempt++) {
    const plan = await makePlan(store, input, avoidTopic)
    const knowledgeSnapshot =
      knowledgeService && knowledgeService.config.mode !== 'off'
        ? await knowledgeService.retrieve(
            {
              categoryId: plan.category,
              topicId: plan.topicId,
              mode: plan.mode,
              technicalVersion: plan.technicalVersion,
              query: plan.topic
            },
            { signal }
          )
        : undefined
    const prompts = buildStreamQuestionPrompt(plan, reason, knowledgeSnapshot)
    try {
      const options = { temperature: 0.7, max_tokens: 2200, signal }
      const result = stream
        ? await consumeStream(
            await callAIStream(prompts.systemPrompt, prompts.userPrompt, options),
            onPreview,
            signal
          )
        : await callAI(prompts.systemPrompt, prompts.userPrompt, options)
      const q = completeQuestion(parseJSON(result.content), plan, result.model, knowledgeSnapshot)
      if (input.existingTitles.some((title) => titleKey(title) === titleKey(q.title))) {
        fail('题目重复，请重新生成')
      }
      if (signal?.aborted) {
        throw new Error('请求已取消')
      }
      try {
        await store.putGeneratedQuestion(q)
      } catch (error) {
        if (error.status === 409) {
          throw error
        }
        fail('题目未保存，请检查本地数据服务后重试', 503)
      }
      return q
    } catch (error) {
      if (signal?.aborted || !['502', '409'].includes(String(error.status)) || attempt === 1) {
        throw error
      }
      reason = error.status === 409 ? '题目与已保存题目重复' : error.message
      avoidTopic = plan.topic
      onPreview?.('')
    }
  }
}

// 旧题首次评分前先补齐并保存标准，后续评分继续使用同一套题目规则。
async function ensureRubric(store, q, signal) {
  if (q.rubric && q.referenceAnswer) {
    return q
  }
  const upgraded = {
    ...q,
    technicalVersion: q.technicalVersion || versionFor(q.categoryId),
    topic: q.topic || '旧题复盘'
  }
  const trusted = verifiedRubric(upgraded)
  if (trusted) {
    upgraded.rubric = trusted
    upgraded.optionalPoints = []
    Object.assign(upgraded, referenceFor(upgraded))
  } else {
    const prompts = buildRubricPrompt(
      upgraded,
      factsFor(upgraded).flatMap((x) => x.facts)
    )
    const response = await callAI(prompts.systemPrompt, prompts.userPrompt, {
      temperature: 0.1,
      max_tokens: 1800,
      signal
    })
    const value = parseJSON(response.content)
    upgraded.rubric = rubric(value.rubric)
    upgraded.optionalPoints = strings(value.optionalPoints, '可选拓展')
    upgraded.referenceAnswer = string(value.referenceAnswer, '参考要点', 10000)
    upgraded.model = q.model || response.model
    Object.assign(upgraded, referenceFor(upgraded))
  }
  upgraded.promptVersion = q.promptVersion || RUBRIC_PROMPT_VERSION
  if (signal?.aborted) {
    throw new Error('请求已取消')
  }
  const result = normalizeQuestion(upgraded)
  try {
    await store.putQuestion(result)
  } catch {
    fail('评分规则未保存，请检查本地数据服务后重试', 503)
  }
  return result
}
module.exports = { generateQuestion, consumeStream, completeQuestion, ensureRubric }
