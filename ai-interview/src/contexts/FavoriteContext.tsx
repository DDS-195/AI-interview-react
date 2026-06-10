import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { FavoriteQuestion } from '../types'
import { saveFavorites, loadFavorites } from '../utils/localStorage'
import { uploadCollection } from '../utils/cloudSync'

interface FavoriteContextType {
  favoriteQuestions: FavoriteQuestion[]
  toggleFavorite: (questionId: string) => void
  isFavorite: (questionId: string) => boolean
  removeFavorite: (fav: FavoriteQuestion) => void
  clearAll: () => void
  loadFavoritesFromStorage: () => void
}

const FavoriteContext = createContext<FavoriteContextType | null>(null)

export function FavoriteProvider({ children }: { children: ReactNode }) {
  const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestion[]>([])

  // 云同步
  useEffect(() => {
    uploadCollection('favorites', favoriteQuestions)
  }, [favoriteQuestions])

  const toggleFavorite = useCallback((questionId: string) => {
    setFavoriteQuestions(prev => {
      const idx = prev.findIndex(f => f.questionId === questionId)
      let updated: FavoriteQuestion[]
      if (idx >= 0) {
        updated = prev.filter(f => f.questionId !== questionId)
      } else {
        updated = [...prev, { questionId, addedAt: new Date().toISOString() }]
      }
      saveFavorites(updated)
      return updated
    })
  }, [])

  const isFavorite = useCallback((questionId: string) => {
    return favoriteQuestions.some(f => f.questionId === questionId)
  }, [favoriteQuestions])

  const removeFavorite = useCallback((fav: FavoriteQuestion) => {
    setFavoriteQuestions(prev => {
      const updated = prev.filter(f => f.questionId !== fav.questionId)
      saveFavorites(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setFavoriteQuestions([])
    saveFavorites([])
  }, [])

  const loadFavoritesFromStorage = useCallback(() => {
    const saved = loadFavorites()
    if (saved && Array.isArray(saved)) {
      setFavoriteQuestions(saved.filter((f): f is FavoriteQuestion => !!f && typeof (f as Record<string, unknown>).questionId === 'string' && typeof (f as Record<string, unknown>).addedAt === 'string'))
    }
  }, [])

  const value = useMemo(() => ({
    favoriteQuestions, toggleFavorite, isFavorite, removeFavorite, clearAll, loadFavoritesFromStorage
  }), [favoriteQuestions, toggleFavorite, isFavorite, removeFavorite, clearAll, loadFavoritesFromStorage])

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  )
}

export function useFavoriteContext() {
  const ctx = useContext(FavoriteContext)
  if (!ctx) throw new Error('useFavoriteContext must be used within FavoriteProvider')
  return ctx
}
