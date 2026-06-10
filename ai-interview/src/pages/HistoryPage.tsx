import HistoryView from '../components/HistoryView'
import { useQuestionContext, CATEGORIES } from '../contexts/QuestionContext'
import { useHistoryContext } from '../contexts/HistoryContext'

interface HistoryPageProps {
  onNavigateToQuestion: () => void
}

export default function HistoryPage({ onNavigateToQuestion }: HistoryPageProps) {
  const { getAllQuestions } = useQuestionContext()
  const { historyRecords, deleteRecord, clearAll } = useHistoryContext()

  return (
    <HistoryView
      historyRecords={historyRecords}
      questions={getAllQuestions()}
      categories={CATEGORIES}
      onDeleteRecord={deleteRecord}
      onClearAll={clearAll}
      onBack={onNavigateToQuestion}
    />
  )
}
