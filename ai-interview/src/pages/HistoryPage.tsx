import HistoryView from '../components/HistoryView'
import { useQuestionContext, CATEGORIES } from '../contexts/QuestionContext'
import { useHistoryContext } from '../contexts/HistoryContext'
import type { HistoryRecord } from '../types'

interface HistoryPageProps {
  onNavigateToQuestion: () => void
}

export default function HistoryPage({ onNavigateToQuestion }: HistoryPageProps) {
  const { questions, selectCategory, setCurrentQuestionIndex } = useQuestionContext()
  const { historyRecords, deleteRecord } = useHistoryContext()

  const handleLoadRecord = (record: HistoryRecord) => {
    const question = questions.find(q => q.id === record.questionId)
    if (question) {
      selectCategory(question.categoryId)
      const categoryQuestions = questions.filter(q => q.categoryId === question.categoryId)
      const questionIndex = categoryQuestions.findIndex(q => q.id === record.questionId)
      if (questionIndex >= 0) {
        setCurrentQuestionIndex(questionIndex)
      }
      onNavigateToQuestion()
    }
  }

  return (
    <HistoryView
      historyRecords={historyRecords}
      questions={questions}
      categories={CATEGORIES}
      onLoadRecord={handleLoadRecord}
      onDeleteRecord={deleteRecord}
      onBack={onNavigateToQuestion}
    />
  )
}
