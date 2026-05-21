import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { HistoryRecord } from '../types'
import { saveHistory, loadHistory } from '../utils/localStorage'

interface HistoryContextType {
  historyRecords: HistoryRecord[]
  addHistoryRecord: (questionId: string, answer: string) => void
  deleteRecord: (record: HistoryRecord) => void
  loadHistoryFromStorage: () => void
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])

  const addHistoryRecord = useCallback((questionId: string, answer: string) => {
    setHistoryRecords(prev => {
      const updated = [{ questionId, answer, submittedAt: new Date().toISOString() }, ...prev]
      saveHistory(updated)
      return updated
    })
  }, [])

  const deleteRecord = useCallback((record: HistoryRecord) => {
    setHistoryRecords(prev => {
      const updated = prev.filter(r => r.submittedAt !== record.submittedAt)
      saveHistory(updated)
      return updated
    })
  }, [])

  const loadHistoryFromStorage = useCallback(() => {
    const hist = loadHistory()
    if (hist && Array.isArray(hist)) {
      setHistoryRecords(hist.filter((r): r is HistoryRecord => !!r && typeof (r as Record<string, unknown>).questionId === 'string' && typeof (r as Record<string, unknown>).submittedAt === 'string'))
    }
  }, [])

  const value = useMemo(() => ({
    historyRecords, addHistoryRecord, deleteRecord, loadHistoryFromStorage
  }), [historyRecords, addHistoryRecord, deleteRecord, loadHistoryFromStorage])

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
