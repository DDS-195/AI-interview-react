// 连接收藏摘要、分页和打开练习；离页时取消尚未完成的题目读取。
import FavoritesView from '../components/FavoritesView'
import { useQuestionContext, CATEGORIES } from '../contexts/QuestionContext'
import { useFavoriteContext } from '../contexts/FavoriteContext'
import type { FavoriteQuestion } from '../types'
import type { FavoriteListItem } from '../types'
import { usePagedData } from '../hooks/usePagedData'
import { message } from 'antd'
import { useState, useRef, useEffect } from 'react'

interface FavoritesPageProps {
  onNavigateToQuestion: () => void
}

export default function FavoritesPage({ onNavigateToQuestion }: FavoritesPageProps) {
  const { getQuestionById, openQuestion } = useQuestionContext()
  const { removeFavorite, clearAll } = useFavoriteContext()
  const list = usePagedData<FavoriteListItem>('favorites')
  const [messageApi, contextHolder] = message.useMessage()
  const [loadingId, setLoadingId] = useState('')
  const activeRequest = useRef<AbortController | null>(null)
  useEffect(() => () => activeRequest.current?.abort(), [])

  const handleLoadFavorite = async (fav: FavoriteQuestion) => {
    if (activeRequest.current && !activeRequest.current.signal.aborted) {
      return
    }
    const controller = new AbortController()
    activeRequest.current = controller
    setLoadingId(fav.questionId)
    try {
      const question = await getQuestionById(fav.questionId, controller.signal)
      if (controller.signal.aborted) {
        return
      }
      openQuestion(question)
      onNavigateToQuestion()
    } catch (error) {
      if (!controller.signal.aborted) {
        messageApi.error(error instanceof Error ? error.message : '题目加载失败')
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingId('')
      }
      if (activeRequest.current === controller) {
        activeRequest.current = null
      }
    }
  }

  return (
    <>
      {contextHolder}
      <FavoritesView
        {...list}
        loadingId={loadingId}
        categories={CATEGORIES}
        onLoadFavorite={handleLoadFavorite}
        onRemoveFavorite={removeFavorite}
        onClearAll={clearAll}
        onBack={onNavigateToQuestion}
      />
    </>
  )
}
