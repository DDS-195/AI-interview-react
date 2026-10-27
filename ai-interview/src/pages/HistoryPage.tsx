// 连接历史分页与删除操作，详情展示由 HistoryView 负责。
import HistoryView from '../components/HistoryView'
import { CATEGORIES } from '../contexts/QuestionContext'
import { useHistoryContext } from '../contexts/HistoryContext'
import { usePagedData } from '../hooks/usePagedData'
import type { HistoryListItem } from '../types'

interface HistoryPageProps {
  onNavigateToQuestion: () => void
}

export default function HistoryPage({ onNavigateToQuestion }: HistoryPageProps) {
  const list = usePagedData<HistoryListItem>('history')
  const { deleteRecord, clearAll } = useHistoryContext()

  return (
    <HistoryView
      {...list}
      categories={CATEGORIES}
      onDeleteRecord={deleteRecord}
      onClearAll={clearAll}
      onBack={onNavigateToQuestion}
    />
  )
}
