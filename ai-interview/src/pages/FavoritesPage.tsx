import FavoritesView from '../components/FavoritesView'
import { useQuestionContext, CATEGORIES } from '../contexts/QuestionContext'
import { useFavoriteContext } from '../contexts/FavoriteContext'
import type { FavoriteQuestion } from '../types'

interface FavoritesPageProps {
  onNavigateToQuestion: () => void
}

export default function FavoritesPage({ onNavigateToQuestion }: FavoritesPageProps) {
  const { questions, selectCategory, setCurrentQuestionIndex } = useQuestionContext()
  const { favoriteQuestions, removeFavorite } = useFavoriteContext()

  const handleLoadFavorite = (fav: FavoriteQuestion) => {
    const question = questions.find(q => q.id === fav.questionId)
    if (question) {
      selectCategory(question.categoryId)
      const categoryQuestions = questions.filter(q => q.categoryId === question.categoryId)
      const questionIndex = categoryQuestions.findIndex(q => q.id === fav.questionId)
      if (questionIndex >= 0) {
        setCurrentQuestionIndex(questionIndex)
      }
      onNavigateToQuestion()
    }
  }

  return (
    <FavoritesView
      favoriteQuestions={favoriteQuestions}
      questions={questions}
      categories={CATEGORIES}
      onLoadFavorite={handleLoadFavorite}
      onRemoveFavorite={removeFavorite}
      onBack={onNavigateToQuestion}
    />
  )
}
