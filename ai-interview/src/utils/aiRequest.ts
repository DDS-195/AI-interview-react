import type { AIEvaluation } from '../types'

const CLOUDBASE_GATEWAY = import.meta.env.VITE_CLOUDBASE_GATEWAY || ''

const BACKEND_API_BASE_URL = import.meta.env.PROD
  ? `${CLOUDBASE_GATEWAY}/api`
  : '/api'

// SSE 流式生成题目
export const generateAIQuestionStream = (
  category: string,
  existingTitles: string[] = [],
  onChunk: (chunk: string) => void,
  onDone: (title: string, fullContent: string, difficulty: string, topic: string) => void,
  onError: (error: string) => void
) => {
  const controller = new AbortController()

  fetch(`${BACKEND_API_BASE_URL}/ai/generate-question-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, existingTitles }),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const reader = response.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                onError(data.error)
                return
              }
              if (data.done) {
                onDone(data.title || '', data.body || fullContent, data.difficulty || 'medium', data.topic || '')
                return
              }
              if (data.content) {
                fullContent = data.fullContent || (fullContent + data.content)
                onChunk(fullContent)
              }
            } catch { /* skip unparseable lines */ }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError(err.message)
      }
    })

  return controller
}

// 评估答案
export const evaluateAIAnswer = async (
  question: string,
  userAnswer: string
): Promise<AIEvaluation> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/ai/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer: userAnswer })
    })
    const ev = await response.json()
    return {
      score: Math.min(100, Math.max(0, ev.score || 50)),
      feedback: ev.feedback || '评估完成',
      correctAnswer: ev.correctAnswer,
      suggestions: ev.suggestions
    }
  } catch (error) {
    console.error('评估失败', error)
    return {
      score: 0,
      feedback: '评估服务异常',
      correctAnswer: '暂无',
      suggestions: ['稍后重试']
    }
  }
}
