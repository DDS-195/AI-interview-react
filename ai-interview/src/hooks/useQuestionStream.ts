// 生成网络流和打字机动画分别管理；取消请求与阻止旧回调需要同时处理。
import { useState, useCallback, useRef, useEffect } from 'react'
import type { Question, QuestionMode } from '../types'
import { generateAIQuestionStream } from '../utils/aiRequest'

interface UseQuestionStreamOptions {
  mode?: QuestionMode
  topicId?: string
  difficulty?: Question['difficulty']
  categoryId: string
  existingTitles: string[]
  onQuestionGenerated: (question: Question) => void
}

interface UseQuestionStreamReturn {
  isStreaming: boolean
  streamingContent: string
  streamingTitle: string
  hasStarted: boolean
  error: string | null
  startStreaming: () => void
  abortStream: () => void
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
    if (!fullText.startsWith(fullBufferRef.current)) {
      revealedRef.current = 0
      setDisplayText('')
    }
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

  const finish = useCallback(
    (fullText: string) => {
      stop()
      revealedRef.current = fullText.length
      fullBufferRef.current = fullText
      setDisplayText(fullText)
    },
    [stop]
  )

  // 组件卸载时清理定时器
  useEffect(() => () => stop(), [stop])

  return { displayText, push, finish, reset }
}

export function useQuestionStream({
  mode = 'theory',
  topicId,
  difficulty,
  categoryId,
  existingTitles,
  onQuestionGenerated
}: UseQuestionStreamOptions): UseQuestionStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingTitle, setStreamingTitle] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastCleanRef = useRef('')
  // 取消不能阻止所有已排队回调，递增请求身份后旧内容、完成和错误都失效。
  const generationRef = useRef(0)
  const {
    displayText: streamingContent,
    push: pushTypewriter,
    finish: finishTypewriter,
    reset: resetTypewriter
  } = useTypewriter()

  // ref 用于 startStreaming 守卫，避免闭包读到的 isStreaming 是旧值
  const isStreamingRef = useRef(isStreaming)
  isStreamingRef.current = isStreaming

  const existingTitlesRef = useRef(existingTitles)
  existingTitlesRef.current = existingTitles
  const categoryIdRef = useRef(categoryId)
  categoryIdRef.current = categoryId
  const optionsRef = useRef({ mode, topicId, difficulty })
  optionsRef.current = { mode, topicId, difficulty }
  const onGeneratedRef = useRef(onQuestionGenerated)
  onGeneratedRef.current = onQuestionGenerated

  useEffect(() => {
    return () => {
      generationRef.current += 1
      abortRef.current?.abort()
    }
  }, [])

  const startStreaming = useCallback(() => {
    if (isStreamingRef.current) {
      return
    }

    const generation = ++generationRef.current
    isStreamingRef.current = true
    abortRef.current?.abort()
    resetTypewriter()
    lastCleanRef.current = ''
    setError(null)

    setIsStreaming(true)
    setStreamingTitle('')
    setHasStarted(false)

    const cid = categoryIdRef.current
    const titles = existingTitlesRef.current
    const options = optionsRef.current
    // 同时检查请求版本和出题范围，防止筛选变化后旧流覆盖新选择。
    const isCurrent = () =>
      generation === generationRef.current &&
      cid === categoryIdRef.current &&
      options.mode === optionsRef.current.mode &&
      options.topicId === optionsRef.current.topicId &&
      options.difficulty === optionsRef.current.difficulty

    const controller = generateAIQuestionStream(
      cid,
      titles,
      (chunk: string) => {
        if (!isCurrent()) {
          return
        }
        const cleanContent = chunk
        lastCleanRef.current = cleanContent
        const lines = cleanContent.split('\n')
        const title =
          lines[0]
            ?.replace(/^#+\s*/, '')
            .replace(/^\*\*/, '')
            .replace(/\*\*$/, '')
            .trim() || ''
        setStreamingTitle(title)
        pushTypewriter(lines.slice(1).join('\n'))
        setHasStarted(Boolean(cleanContent))
      },
      (
        title: string,
        body: string,
        difficulty: string,
        topic: string,
        generatedQuestion?: Question
      ) => {
        if (!isCurrent()) {
          return
        }
        const finalTitle = title || `${cid} 面试题`
        const finalContent = body || lastCleanRef.current
        finishTypewriter(finalContent)
        const newQuestion: Question = generatedQuestion || {
          id: `ai-${crypto.randomUUID()}`,
          topic,
          categoryId: cid,
          title: finalTitle,
          content: finalContent,
          difficulty: (['easy', 'medium', 'hard'].includes(difficulty)
            ? difficulty
            : 'medium') as Question['difficulty'],
          type: options.mode === 'coding' ? 'code' : 'text',
          mode: options.mode,
          topicId: options.topicId
        }
        onGeneratedRef.current(newQuestion)
        isStreamingRef.current = false
        setIsStreaming(false)
        setHasStarted(false)
      },
      (error: string) => {
        if (!isCurrent()) {
          return
        }
        setError(error)
        resetTypewriter()
        isStreamingRef.current = false
        setIsStreaming(false)
        setHasStarted(false)
      },
      options
    )

    abortRef.current = controller
  }, [resetTypewriter, pushTypewriter, finishTypewriter])

  const abortStream = useCallback(() => {
    generationRef.current += 1
    abortRef.current?.abort()
    isStreamingRef.current = false
    setIsStreaming(false)
    setHasStarted(false)
    setError(null)
    setStreamingTitle('')
    resetTypewriter()
  }, [resetTypewriter])

  return {
    isStreaming,
    streamingContent,
    streamingTitle,
    hasStarted,
    error,
    startStreaming,
    abortStream
  }
}
