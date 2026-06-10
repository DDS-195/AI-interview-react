import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { HistoryRecord } from '../types'
import { saveHistory, loadHistory, saveHistoryDetail, removeHistoryDetail } from '../utils/localStorage'
import { uploadCollection } from '../utils/cloudSync'

interface HistoryContextType {
  historyRecords: HistoryRecord[]
  addHistoryRecord: (questionId: string, answer: string, evalData?: { score?: number; correctAnswer?: string; feedback?: string }) => void
  deleteRecord: (record: HistoryRecord) => void
  clearAll: () => void
  loadHistoryFromStorage: () => void
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])

  // 云同步（仅同步轻量列表，详情已单独存）
  useEffect(() => {
    uploadCollection('history', historyRecords)
  }, [historyRecords])

  const addHistoryRecord = useCallback((questionId: string, answer: string, evalData?: { score?: number; correctAnswer?: string; feedback?: string }) => {
    const submittedAt = new Date().toISOString()
    const { correctAnswer, feedback, ...rest } = (evalData || {})
    // 大字段拆分到独立 key
    if (correctAnswer || feedback) {
      saveHistoryDetail(submittedAt, { correctAnswer, feedback })
    }
    // 列表只存轻量数据
    const record: HistoryRecord = { questionId, answer, submittedAt, ...rest }
    // 注意：score 是数字，大小可忽略，保留在列表里
    setHistoryRecords(prev => {
      const updated = [record, ...prev]
      saveHistory(updated)
      return updated
    })
  }, [])

  const deleteRecord = useCallback((record: HistoryRecord) => {
    removeHistoryDetail(record.submittedAt)
    setHistoryRecords(prev => {
      const updated = prev.filter(r => r.submittedAt !== record.submittedAt)
      saveHistory(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    // 清理全部详情 key
    historyRecords.forEach(r => removeHistoryDetail(r.submittedAt))
    setHistoryRecords([])
    saveHistory([])
  }, [historyRecords])

  const loadHistoryFromStorage = useCallback(() => {
    const hist = loadHistory()
    if (hist && Array.isArray(hist)) {
      // 向后兼容：迁移旧记录中的大字段到独立 key
      let migrated = false
      const migratedRecords = hist.map((r: any) => {
        if (r.correctAnswer || r.feedback) {
          saveHistoryDetail(r.submittedAt, { correctAnswer: r.correctAnswer, feedback: r.feedback })
          migrated = true
          const { correctAnswer, feedback, ...light } = r
          return light
        }
        return r
      })
      if (migrated) saveHistory(migratedRecords)
      setHistoryRecords(migratedRecords.filter((r): r is HistoryRecord => !!r && typeof (r as Record<string, unknown>).questionId === 'string' && typeof (r as Record<string, unknown>).submittedAt === 'string'))
    }
  }, [])

  const value = useMemo(() => ({
    historyRecords, addHistoryRecord, deleteRecord, clearAll, loadHistoryFromStorage
  }), [historyRecords, addHistoryRecord, deleteRecord, clearAll, loadHistoryFromStorage])

  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  )
}

export function useHistoryContext() {
  const ctx = useContext(HistoryContext)
  if (!ctx) throw new Error('useHistoryContext must be used within HistoryProvider')
  return ctx
}
