// 历史写操作复用数据层，评分成功后的记录已由后端保存。
import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import type { HistoryRecord } from '../types'
import { useDataContext } from './DataContext'

interface HistoryContextType {
  deleteRecord: (record: Pick<HistoryRecord, 'submittedAt'>) => void
  clearAll: () => void
}

const HistoryContext = createContext<HistoryContextType | null>(null)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { mutate } = useDataContext()
  const deleteRecord = useCallback(
    (record: Pick<HistoryRecord, 'submittedAt'>) => {
      void mutate(`/history/${encodeURIComponent(record.submittedAt)}`, 'DELETE').catch(() => {})
    },
    [mutate]
  )
  const clearAll = useCallback(() => {
    void mutate('/history', 'DELETE').catch(() => {})
  }, [mutate])

  const value = useMemo(() => ({ deleteRecord, clearAll }), [deleteRecord, clearAll])
  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
}

export function useHistoryContext() {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistoryContext must be used within HistoryProvider')
  }
  return context
}
