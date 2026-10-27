// AI 请求协议边界：流式出题手动解码 SSE，评分使用普通 JSON 请求。
import type { AIEvaluation, Question, QuestionMode } from '../types'
import { requestJSON, responseError } from './httpRequest'
import { parseKnowledgeSnapshot } from './knowledgeSnapshot'

const BACKEND_API_BASE_URL = '/api'

// SSE 流式生成题目
export const generateAIQuestionStream = (
  category: string,
  existingTitles: string[] = [],
  onChunk: (chunk: string) => void,
  onDone: (
    title: string,
    fullContent: string,
    difficulty: string,
    topic: string,
    question?: Question
  ) => void,
  onError: (error: string) => void,
  options: { mode?: QuestionMode; topicId?: string; difficulty?: Question['difficulty'] } = {}
) => {
  const controller = new AbortController()

  // 业务 done、错误、主动取消和超时是不同结束路径，最多通知一次终态。
  let terminal = false
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, 130000)
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

  fetch(`${BACKEND_API_BASE_URL}/ai/generate-question-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, existingTitles, ...options }),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await responseError(response))
      }
      reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      // 这里只消费后端定义的单行 JSON data 事件，不实现 EventSource 自动重连。
      function processLine(line: string) {
        if (!line.startsWith('data:')) {
          return
        }
        const raw = line.slice(5).trim()
        if (!raw) {
          return
        }
        let data
        try {
          data = JSON.parse(raw)
        } catch {
          throw new Error('AI 流式数据格式无效，请重新生成')
        }
        if (data?.error) {
          throw new Error(typeof data.error === 'string' ? data.error : 'AI 生成失败')
        }
        if (data?.done) {
          const body = typeof data.body === 'string' ? data.body : fullContent
          if (!body.trim()) {
            throw new Error('AI 未返回题目内容，请重新生成')
          }
          if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
            throw new Error('题目难度无效，请重新生成')
          }
          if (data.question) {
            if (
              typeof data.question.id !== 'string' ||
              data.question.categoryId !== category ||
              data.question.content !== body
            ) {
              throw new Error('题目数据不完整，请重新生成')
            }
            terminal = true
            onDone(data.title || '', body, data.difficulty, data.topic || '', data.question)
          } else {
            terminal = true
            onDone(data.title || '', body, data.difficulty, data.topic || '')
          }
          return
        }
        if (typeof data?.content === 'string') {
          fullContent =
            typeof data.fullContent === 'string' ? data.fullContent : fullContent + data.content
          onChunk(fullContent)
        }
      }

      // 网络 chunk 不等于完整消息；保留残行，并让 TextDecoder 连续处理跨字节字符。
      while (!terminal) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          for (const line of buffer.split('\n')) {
            processLine(line)
            if (terminal) {
              break
            }
          }
          if (!terminal) {
            throw new Error('题目生成中断，请重新生成')
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          processLine(line)
          if (terminal) {
            break
          }
        }
      }
    })
    .catch((err) => {
      if (!terminal && (!controller.signal.aborted || timedOut)) {
        terminal = true
        onError(timedOut ? '题目生成超时，请重试' : err.message)
      }
    })
    .finally(async () => {
      clearTimeout(timer)
      if (reader) {
        await reader.cancel().catch(() => {})
        reader.releaseLock()
      }
    })

  return controller
}

// 评估答案
export const evaluateAIAnswer = async (
  questionId: string,
  userAnswer: string,
  submittedAt?: string
): Promise<AIEvaluation> => {
  const ev = await requestJSON<Record<string, unknown>>(
    `${BACKEND_API_BASE_URL}/ai/evaluate-answer`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer: userAnswer, submittedAt }),
      timeoutMs: 150000
    }
  )
  if (
    !ev ||
    typeof ev.score !== 'number' ||
    !Number.isFinite(ev.score) ||
    ev.score < 0 ||
    ev.score > 100 ||
    typeof ev.feedback !== 'string' ||
    !ev.feedback.trim()
  ) {
    throw new Error('AI 返回的评分无效，请重新提交')
  }
  if (
    ev.criteria !== undefined &&
    (!Array.isArray(ev.criteria) ||
      ev.criteria.some((item: unknown) => {
        if (!item || typeof item !== 'object') {
          return true
        }
        const value = item as Record<string, unknown>
        return (
          typeof value.id !== 'string' ||
          typeof value.description !== 'string' ||
          typeof value.evidence !== 'string' ||
          typeof value.explanation !== 'string' ||
          typeof value.points !== 'number' ||
          !Number.isFinite(value.points) ||
          typeof value.maxPoints !== 'number' ||
          !Number.isInteger(value.maxPoints) ||
          value.maxPoints < 1 ||
          value.maxPoints > 100 ||
          value.points < 0 ||
          value.points > value.maxPoints ||
          !['met', 'partial', 'missed', 'incorrect'].includes(String(value.verdict)) ||
          (value.sourceIds !== undefined &&
            (!Array.isArray(value.sourceIds) ||
              value.sourceIds.some((id) => typeof id !== 'string')))
        )
      }))
  ) {
    throw new Error('评分细项格式无效，请重试')
  }
  if (typeof ev.submittedAt !== 'string' || !Number.isFinite(Date.parse(ev.submittedAt))) {
    throw new Error('评分记录未确认保存，请重试')
  }
  return {
    score: ev.score,
    submittedAt: ev.submittedAt,
    criteria: ev.criteria as AIEvaluation['criteria'],
    topic: typeof ev.topic === 'string' ? ev.topic : undefined,
    topicId: typeof ev.topicId === 'string' ? ev.topicId : undefined,
    mode: ['theory', 'scenario', 'coding', 'debug'].includes(String(ev.mode))
      ? (ev.mode as QuestionMode)
      : undefined,
    codeLanguage: ['javascript', 'typescript', 'html', 'css'].includes(String(ev.codeLanguage))
      ? (ev.codeLanguage as Question['codeLanguage'])
      : undefined,
    technicalVersion: typeof ev.technicalVersion === 'string' ? ev.technicalVersion : undefined,
    promptVersion: typeof ev.promptVersion === 'string' ? ev.promptVersion : undefined,
    questionPromptVersion:
      typeof ev.questionPromptVersion === 'string' ? ev.questionPromptVersion : undefined,
    model: typeof ev.model === 'string' ? ev.model : undefined,
    referenceStatus:
      ev.referenceStatus === 'verified' ||
      ev.referenceStatus === 'generated' ||
      ev.referenceStatus === 'grounded'
        ? ev.referenceStatus
        : undefined,
    knowledgeSnapshot: parseKnowledgeSnapshot(ev.knowledgeSnapshot),
    sources: Array.isArray(ev.sources)
      ? ev.sources.filter(
          (x): x is { title: string; url: string } =>
            !!x &&
            typeof x.title === 'string' &&
            typeof x.url === 'string' &&
            x.url.startsWith('https://')
        )
      : [],
    uncertainties: Array.isArray(ev.uncertainties)
      ? ev.uncertainties.filter((x: unknown) => typeof x === 'string')
      : [],
    feedback: typeof ev.feedback === 'string' ? ev.feedback : '评估完成',
    correctAnswer: typeof ev.correctAnswer === 'string' ? ev.correctAnswer : undefined,
    suggestions: Array.isArray(ev.suggestions)
      ? ev.suggestions.filter((value: unknown) => typeof value === 'string')
      : []
  }
}
