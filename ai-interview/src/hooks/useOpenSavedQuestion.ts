// 打开已有题目时复用保存内容；控制器和 loading 都归属于本次打开操作。
import { useEffect, useRef, useState } from 'react'
import { useQuestionContext } from '../contexts/QuestionContext'

export function useOpenSavedQuestion(onOpened: () => void, onError: (message: string) => void) {
  const { getQuestionById, openQuestion } = useQuestionContext()
  const active = useRef<AbortController | null>(null)
  const [loadingId, setLoadingId] = useState('')
  useEffect(() => () => active.current?.abort(), [])
  async function open(id: string) {
    if (active.current) {
      return
    }
    const controller = new AbortController()
    active.current = controller
    setLoadingId(id)
    try {
      const question = await getQuestionById(id, controller.signal)
      if (!controller.signal.aborted) {
        openQuestion(question)
        onOpened()
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onError(error instanceof Error ? error.message : '题目加载失败')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingId('')
      }
      if (active.current === controller) {
        active.current = null
      }
    }
  }
  return { open, loadingId }
}
