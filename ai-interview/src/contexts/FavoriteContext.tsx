// 收藏动作委托数据层串行执行，避免快速操作被过期全量快照覆盖。
import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import type { FavoriteQuestion } from '../types'
import { useDataContext } from './DataContext'

interface FavoriteContextType {
  favoriteQuestions: FavoriteQuestion[]
  toggleFavorite: (questionId: string) => void
  isFavorite: (questionId: string) => boolean
  removeFavorite: (fav: FavoriteQuestion) => void
  clearAll: () => void
}

const FavoriteContext = createContext<FavoriteContextType | null>(null)

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const { data, mutate } = useDataContext()
  const favoriteQuestions = data.favorites
  const favoriteIds = useMemo(
    () => new Set(favoriteQuestions.map((f) => f.questionId)),
    [favoriteQuestions]
  )

  const toggleFavorite = useCallback(
    (questionId: string) => {
      void mutate('/favorites/toggle', 'POST', { questionId }).catch(() => {})
    },
    [mutate]
  )
  const isFavorite = useCallback(
    (questionId: string) => {
      return favoriteIds.has(questionId)
    },
    [favoriteIds]
  )
  const removeFavorite = useCallback(
    (fav: FavoriteQuestion) => {
      void mutate(`/favorites/${encodeURIComponent(fav.questionId)}`, 'DELETE').catch(() => {})
    },
    [mutate]
  )
  const clearAll = useCallback(() => {
    void mutate('/favorites', 'DELETE').catch(() => {})
  }, [mutate])

  const value = useMemo(
    () => ({ favoriteQuestions, toggleFavorite, isFavorite, removeFavorite, clearAll }),
    [favoriteQuestions, toggleFavorite, isFavorite, removeFavorite, clearAll]
  )

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>
}

export function useFavoriteContext() {
  const context = useContext(FavoriteContext)
  if (!context) {
    throw new Error('useFavoriteContext must be used within FavoriteProvider')
  }
  return context
}
