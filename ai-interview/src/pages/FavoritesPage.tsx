import FavoritesView from '../components/FavoritesView'
import { useQuestionContext, CATEGORIES } from '../contexts/QuestionContext'
import { useFavoriteContext } from '../contexts/FavoriteContext'
import type { FavoriteQuestion } from '../types'

interface FavoritesPageProps {
  onNavigateToQuestion: () => void
}

export default function FavoritesPage({ onNavigateToQuestion }: FavoritesPageProps) {
  const { questions, selectCategory, setCurrentQuestionIndex, getQuestionById, getAllQuestions, addQuestion } = useQuestionContext()
  const { favoriteQuestions, removeFavorite, clearAll } = useFavoriteContext()

  const handleLoadFavorite = (fav: FavoriteQuestion) => {
    const question = getQuestionById(fav.questionId)
    if (!question) return

    const isInActive = questions.some(q => q.id === fav.questionId)

    selectCategory(question.categoryId)

    if (isInActive) {
      // 已在活跃列表，直接定位到该题
      const inCat = questions.filter(q => q.categoryId === question.categoryId)
      const idx = inCat.findIndex(q => q.id === fav.questionId)
      if (idx >= 0) setCurrentQuestionIndex(idx)
    } else {
      // 不在活跃列表，addQuestion 会自动加到末尾并设 index
      addQuestion(question)
    }

    onNavigateToQuestion()
  }

  return (
    <FavoritesView
      favoriteQuestions={favoriteQuestions}
      questions={getAllQuestions()}
      categories={CATEGORIES}
      onLoadFavorite={handleLoadFavorite}
      onRemoveFavorite={removeFavorite}
      onClearAll={clearAll}
      onBack={onNavigateToQuestion}
    />
  )
}
