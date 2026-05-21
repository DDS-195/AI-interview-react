import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { AIEvaluation } from '../types'
import { evaluateAIAnswer } from '../utils/aiRequest'

interface EvaluationContextType {
  isEvaluatingAnswer: boolean
  aiEvaluationResult: AIEvaluation | null
  showEvaluation: boolean
  evaluateAnswerWithAI: (questionContent: string, answerText: string) => Promise<void>
  closeEvaluation: () => void
  resetEvaluation: () => void
}

const EvaluationContext = createContext<EvaluationContextType | null>(null)

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false)
  const [aiEvaluationResult, setAiEvaluationResult] = useState<AIEvaluation | null>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)

  const evaluateAnswerWithAI = useCallback(async (questionContent: string, answerText: string) => {
    if (!answerText.trim() || isEvaluatingAnswer) return

    setIsEvaluatingAnswer(true)
    setAiEvaluationResult(null)
    setShowEvaluation(false)

    try {
      const evaluation = await evaluateAIAnswer(questionContent, answerText)
      setAiEvaluationResult(evaluation)
      setShowEvaluation(true)
    } catch (error) {
      throw error
    } finally {
      setIsEvaluatingAnswer(false)
    }
  }, [isEvaluatingAnswer])

  const closeEvaluation = useCallback(() => setShowEvaluation(false), [])
  const resetEvaluation = useCallback(() => {
    setShowEvaluation(false)
    setAiEvaluationResult(null)
  }, [])

  const value = useMemo(() => ({
    isEvaluatingAnswer, aiEvaluationResult, showEvaluation,
    evaluateAnswerWithAI, closeEvaluation, resetEvaluation
  }), [isEvaluatingAnswer, aiEvaluationResult, showEvaluation, evaluateAnswerWithAI, closeEvaluation, resetEvaluation])

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  )
}

export function useEvaluationContext() {
  const ctx = useContext(EvaluationContext)
  if (!ctx) throw new Error('useEvaluationContext must be used within EvaluationProvider')
  return ctx
}
