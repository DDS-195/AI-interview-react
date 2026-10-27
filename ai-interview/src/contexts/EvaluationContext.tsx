// 管理评分展示与失败提交标识；重置只隔离旧结果，不主动取消评分请求。
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import type { AIEvaluation } from '../types'
import { evaluateAIAnswer } from '../utils/aiRequest'
import { getStored, setStored, removeStored } from '../utils/browserStorage'

interface EvaluationContextType {
  isEvaluatingAnswer: boolean
  aiEvaluationResult: AIEvaluation | null
  showEvaluation: boolean
  evaluateAnswerWithAI: (questionId: string, answerText: string) => Promise<AIEvaluation | null>
  closeEvaluation: () => void
  resetEvaluation: () => void
}

const EvaluationContext = createContext<EvaluationContextType | null>(null)
let lastSubmissionTime = 0

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false)
  const [aiEvaluationResult, setAiEvaluationResult] = useState<AIEvaluation | null>(null)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const evaluatingRef = useRef(false)
  // 版本号只决定结果能否更新当前界面，不会取消后端正在保存的评分。
  const requestVersion = useRef(0)
  const submission = useRef<{ questionId: string; answerText: string; submittedAt: string } | null>(
    null
  )

  const evaluateAnswerWithAI = useCallback(async (questionId: string, answerText: string) => {
    if (!answerText.trim() || evaluatingRef.current) {
      return null
    }

    evaluatingRef.current = true
    const version = ++requestVersion.current
    setIsEvaluatingAnswer(true)
    setAiEvaluationResult(null)
    setShowEvaluation(false)
    if (
      !submission.current ||
      submission.current.questionId !== questionId ||
      submission.current.answerText !== answerText
    ) {
      lastSubmissionTime = Math.max(Date.now(), lastSubmissionTime + 1)
      submission.current = {
        questionId,
        answerText,
        submittedAt: new Date(lastSubmissionTime).toISOString()
      }
      try {
        const previous = JSON.parse(getStored(`ai_submission_${questionId}`) || 'null')
        if (
          previous?.answerText === answerText &&
          typeof previous.submittedAt === 'string' &&
          new Date(previous.submittedAt).toISOString() === previous.submittedAt
        ) {
          submission.current.submittedAt = previous.submittedAt
        }
      } catch {
        /* 损坏的提交标识不影响重新提交。 */
      }
    }
    // 同题同答案失败重试复用提交标识，使已保存的服务端结果可以安全重放。
    const submittedAt = submission.current.submittedAt
    setStored(`ai_submission_${questionId}`, JSON.stringify(submission.current))

    try {
      const evaluation = await evaluateAIAnswer(questionId, answerText, submittedAt)
      if (submission.current?.submittedAt === submittedAt) {
        submission.current = null
      }
      try {
        if (
          JSON.parse(getStored(`ai_submission_${questionId}`) || 'null')?.submittedAt ===
          submittedAt
        ) {
          removeStored(`ai_submission_${questionId}`)
        }
      } catch {
        /* 以服务端已保存的记录为准。 */
      }
      if (version === requestVersion.current) {
        setAiEvaluationResult(evaluation)
        setShowEvaluation(true)
      }
      return evaluation
    } finally {
      if (version === requestVersion.current) {
        evaluatingRef.current = false
        setIsEvaluatingAnswer(false)
      }
    }
  }, [])

  const closeEvaluation = useCallback(() => setShowEvaluation(false), [])
  const resetEvaluation = useCallback(() => {
    requestVersion.current += 1
    evaluatingRef.current = false
    setIsEvaluatingAnswer(false)
    setShowEvaluation(false)
    setAiEvaluationResult(null)
  }, [])

  const value = useMemo(
    () => ({
      isEvaluatingAnswer,
      aiEvaluationResult,
      showEvaluation,
      evaluateAnswerWithAI,
      closeEvaluation,
      resetEvaluation
    }),
    [
      isEvaluatingAnswer,
      aiEvaluationResult,
      showEvaluation,
      evaluateAnswerWithAI,
      closeEvaluation,
      resetEvaluation
    ]
  )

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>
}

export function useEvaluationContext() {
  const ctx = useContext(EvaluationContext)
  if (!ctx) {
    throw new Error('useEvaluationContext must be used within EvaluationProvider')
  }
  return ctx
}
