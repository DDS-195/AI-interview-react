// 评分顺序：读保存规则、逐项判断、程序计分、保存完整历史，最后才返回成功。
const { callAI } = require('./aiService')
const { ensureRubric } = require('./questionFlow')
const { factsFor } = require('../data/knowledge')
const { fail, string, parseJSON, grade } = require('./aiContract')
const { history } = require('./dataValidation')
const {
  buildEvaluationSystemPrompt,
  buildEvaluationUserPrompt,
  EVALUATION_PROMPT_VERSION
} = require('../prompts/evaluationPrompts')

// 仅合并当前进程中同 Store、同提交标识的在途任务，不是分布式任务锁。
const pendingByStore = new WeakMap()
let lastTimestamp = 0
function submissionTime(value) {
  if (value === undefined) {
    lastTimestamp = Math.max(Date.now(), lastTimestamp + 1)
    return new Date(lastTimestamp).toISOString()
  }
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    fail('提交标识格式无效', 400)
  }
  return value
}

// 已落库成绩只能用于完全相同的题目和原始答案，避免提交标识被误复用。
function replay(record, questionId, answer) {
  if (record.questionId !== questionId || record.answer !== answer || record.score === undefined) {
    fail('提交标识已用于其他回答', 409)
  }
  const evaluation = { ...record }
  delete evaluation.questionId
  delete evaluation.answer
  delete evaluation.questionSnapshot
  return evaluation
}

// 评分读取已保存的规则与知识快照，不根据本次回答重新检索并改变标准。
async function assess(store, questionId, answer, submittedAt, signal) {
  signal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(120000)])
    : AbortSignal.timeout(120000)
  const saved = await store.getQuestion(questionId)
  if (!saved) {
    fail('题目不存在或尚未保存，请重新选择题目', 404)
  }
  const question = await ensureRubric(store, saved, signal)
  const facts = factsFor(question).flatMap((card) => card.facts)
  let reason = ''
  let evaluation
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await callAI(
        buildEvaluationSystemPrompt(),
        buildEvaluationUserPrompt(question, answer, facts, reason),
        {
          temperature: 0.1,
          max_tokens: 1800,
          signal
        }
      )
      evaluation = {
        ...grade(parseJSON(response.content), question, answer),
        promptVersion: EVALUATION_PROMPT_VERSION,
        model: response.model,
        submittedAt
      }
      break
    } catch (error) {
      if (signal?.aborted || error.status !== 502 || attempt === 1) {
        throw error
      }
      reason = error.message
    }
  }
  if (signal?.aborted) {
    throw new Error('请求已取消')
  }
  // 成绩只有在完整历史落库后才能返回，写入失败不重做付费评分。
  try {
    await store.addHistory(
      history({ questionId, answer, ...evaluation, questionSnapshot: question })
    )
  } catch (cause) {
    if (cause.status === 409) {
      const existing = await store.historyDetail(submittedAt)
      if (existing) {
        return replay(existing.record, questionId, answer)
      }
    }
    fail('评分记录未保存，请检查本地数据服务后重试', 503)
  }
  return evaluation
}

// 先读持久化结果，再查在途任务；失败任务会移除，下一次提交仍可能再次调用模型。
async function evaluateAnswer(store, input, signal) {
  if (!store) {
    fail('本地数据服务未就绪', 503)
  }
  const questionId = string(input?.questionId, '题目ID', 200, 400)
  string(input?.answer, '回答', 30000, 400)
  const answer = input.answer
  const submittedAt = submissionTime(input.submittedAt)
  const existing = await store.historyDetail(submittedAt)
  if (existing) {
    return replay(existing.record, questionId, answer)
  }
  if (!pendingByStore.has(store)) {
    pendingByStore.set(store, new Map())
  }
  const pending = pendingByStore.get(store)
  const prior = pending.get(submittedAt)
  if (prior) {
    if (prior.questionId !== questionId || prior.answer !== answer) {
      fail('提交标识已用于其他回答', 409)
    }
    return prior.promise
  }
  const promise = assess(store, questionId, answer, submittedAt, signal)
  pending.set(submittedAt, { questionId, answer, promise })
  try {
    return await promise
  } finally {
    pending.delete(submittedAt)
  }
}

module.exports = { evaluateAnswer }
