export interface Category {
  id: string
  name: string
}

export interface Question {
  id: string
  categoryId: string
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'text' | 'code'
}

export interface HistoryRecord {
  questionId: string
  answer: string
  submittedAt: string
  score?: number
  correctAnswer?: string
  feedback?: string
}

export interface FavoriteQuestion {
  questionId: string
  addedAt: string
}

export interface AIQuestion {
  title: string
  content: string
  category: string
  difficulty?: string
  topic?: string
}

export interface AIEvaluation {
  score: number
  feedback: string
  correctAnswer?: string
  suggestions?: string[]
}
