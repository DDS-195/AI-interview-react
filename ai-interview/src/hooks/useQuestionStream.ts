import { useState, useCallback, useRef, useEffect } from 'react'
import type { Question } from '../types'
import { generateAIQuestionStream } from '../utils/aiRequest'

interface UseQuestionStreamOptions {
  categoryId: string
  existingTitles: string[]
  onQuestionGenerated: (question: Question) => void
}

interface UseQuestionStreamReturn {
  isStreaming: boolean
  streamingContent: string
  streamingTitle: string
  hasStarted: boolean
  startStreaming: () => void
  abortStream: () => void
}

function stripTrailingJSON(text: string): string {
  const lines = text.split('\n')
  const last = lines[lines.length - 1]?.trim() || ''

  // 最后一行整个就是 JSON 元数据
  if (/^\{[^{}]*"difficulty"[^{}]*\}$/.test(last)) {
    return lines.slice(0, -1).join('\n').trim()
  }

  // JSON 拼在最后一行末尾
  const tailMatch = last.match(/\{[^{}]*"difficulty"[^{}]*\}$/)
  if (tailMatch) {
    const cleaned = last.slice(0, -tailMatch[0].length).trim()
    lines[lines.length - 1] = cleaned
    return lines.filter(Boolean).join('\n')
  }

  // 兜底：尝试 JSON.parse 检测是否包含元数据
  try {
    const parsed = JSON.parse(last)
    if (parsed && parsed.difficulty) {
      return lines.slice(0, -1).join('\n').trim()
    }
  } catch {}

  return text
}

// ====== 打字机动画层（隔离在 hook 内部，不污染外部） ======
function useTypewriter() {
  const fullBufferRef = useRef('')
  const revealedRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displayText, setDisplayText] = useState('')

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    fullBufferRef.current = ''
    revealedRef.current = 0
    setDisplayText('')
  }, [stop])

  const push = useCallback((fullText: string) => {
    fullBufferRef.current = fullText
    // 如果还没在跑动画，启动
    if (timerRef.current === null) {
      const tick = () => {
        const full = fullBufferRef.current
        const current = revealedRef.current
        if (current >= full.length) {
          timerRef.current = null
          return
        }
        // 每帧推进 2~5 个字符，间隔 20~40ms，模拟打字节奏
        const step = 2 + Math.floor(Math.random() * 4)
        const next = Math.min(current + step, full.length)
        revealedRef.current = next
        setDisplayText(full.slice(0, next))
        timerRef.current = setTimeout(tick, 20 + Math.random() * 20)
      }
      tick()
    }
  }, [])

  const finish = useCallback((fullText: string) => {
    stop()
    revealedRef.current = fullText.length
    fullBufferRef.current = fullText
    setDisplayText(fullText)
  }, [stop])

  // 组件卸载时清理定时器
  useEffect(() => () => stop(), [stop])

  return { displayText, push, finish, reset }
}

export function useQuestionStream({
  categoryId,
  existingTitles,
  onQuestionGenerated
}: UseQuestionStreamOptions): UseQuestionStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingTitle, setStreamingTitle] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const lastCleanRef = useRef('')
  const { displayText: streamingContent, push: pushTypewriter, finish: finishTypewriter, reset: resetTypewriter } = useTypewriter()

  // ref 用于 startStreaming 守卫，避免闭包读到的 isStreaming 是旧值
  const isStreamingRef = useRef(isStreaming)
  isStreamingRef.current = isStreaming

  const existingTitlesRef = useRef(existingTitles)
  existingTitlesRef.current = existingTitles
  const categoryIdRef = useRef(categoryId)
  categoryIdRef.current = categoryId
  const onGeneratedRef = useRef(onQuestionGenerated)
  onGeneratedRef.current = onQuestionGenerated

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const startStreaming = useCallback(() => {
    if (isStreamingRef.current) return

    abortRef.current?.abort()
    resetTypewriter()

    setIsStreaming(true)
    setStreamingTitle('')
    setHasStarted(false)

    const cid = categoryIdRef.current
    const titles = existingTitlesRef.current

    const controller = generateAIQuestionStream(
      cid,
      titles,
      (chunk: string) => {
        const cleanContent = stripTrailingJSON(chunk)
        lastCleanRef.current = cleanContent
        const lines = cleanContent.split('\n').filter(Boolean)
        const title = lines[0]?.replace(/^#+\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim() || ''
        if (title) setStreamingTitle(title)
        pushTypewriter(cleanContent)
        setHasStarted(true)
      },
      (title: string, body: string, difficulty: string, topic: string) => {
        const finalTitle = title || `${cid} 面试题`
        const finalContent = body || lastCleanRef.current
        finishTypewriter(finalContent)
        const newQuestion: Question = {
          id: `ai-${Date.now()}`,
          categoryId: cid,
          title: finalTitle,
          content: finalContent,
          difficulty: (['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium') as Question['difficulty'],
          type: cid === 'coding' ? 'code' : 'text'
        }
        onGeneratedRef.current(newQuestion)
        isStreamingRef.current = false
        setIsStreaming(false)
        setHasStarted(false)
      },
      (error: string) => {
        console.error('生成题目失败:', error)
        isStreamingRef.current = false
        setIsStreaming(false)
        setHasStarted(false)
      }
    )

    abortRef.current = controller
  }, [isStreaming, resetTypewriter, pushTypewriter, finishTypewriter])

  const abortStream = useCallback(() => {
    abortRef.current?.abort()
    isStreamingRef.current = false
    setIsStreaming(false)
    setHasStarted(false)
    resetTypewriter()
  }, [resetTypewriter])

  return { isStreaming, streamingContent, streamingTitle, hasStarted, startStreaming, abortStream }
}
