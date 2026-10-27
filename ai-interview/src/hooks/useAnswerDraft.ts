// 草稿按题目 ID 保存；切题和离页立即刷新最新值，不等待防抖计时。
import { useState, useRef, useEffect, useCallback } from 'react'

function read(questionId?: string) {
  if (!questionId) {
    return ''
  }
  try {
    return localStorage.getItem(`ai_draft_${questionId}`) || ''
  } catch {
    return ''
  }
}

export function useAnswerDraft(questionId?: string) {
  const [draft, setDraft] = useState(() => ({ questionId, text: read(questionId) }))
  const current = useRef(draft)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
    const { questionId: id, text } = current.current
    if (!id) {
      return
    }
    try {
      if (text.trim()) {
        localStorage.setItem(`ai_draft_${id}`, text)
      } else {
        localStorage.removeItem(`ai_draft_${id}`)
      }
    } catch (error) {
      console.warn('草稿保存失败', error)
    }
  }, [])

  useEffect(() => {
    // 清理函数先保存旧题，切题后再读新题；不会把旧答案写到新题上。
    const next = { questionId, text: read(questionId) }
    current.current = next
    setDraft(next)
    return flush
  }, [questionId, flush])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [flush])

  const setAnswerText = useCallback(
    (text: string) => {
      const next = { questionId, text }
      current.current = next
      setDraft(next)
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 500)
    },
    [questionId, flush]
  )

  const answerText = draft.questionId === questionId ? draft.text : read(questionId)
  return { answerText, setAnswerText }
}
