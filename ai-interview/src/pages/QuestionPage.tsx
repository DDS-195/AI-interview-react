import { useState, useEffect, useCallback, useRef } from 'react'
import { message } from 'antd'
import QuestionView from '../components/QuestionView'
import AnswerArea from '../components/AnswerArea'
import EvaluationResult from '../components/EvaluationResult'
import { useQuestionContext } from '../contexts/QuestionContext'
import { useFavoriteContext } from '../contexts/FavoriteContext'
import { useHistoryContext } from '../contexts/HistoryContext'
import { useEvaluationContext } from '../contexts/EvaluationContext'
import { useQuestionStream } from '../hooks/useQuestionStream'

export default function QuestionPage() {
  const {
    selectedCategoryId,
    currentQuestion,
    currentQuestionIndex,
    currentQuestions,
    isCodingCategory,
    addQuestion,
    nextQuestion: goNext,
    prevQuestion: goPrev,
    refreshQuestion,
    getExistingTitles
  } = useQuestionContext()

  const { toggleFavorite, isFavorite } = useFavoriteContext()
  const { addHistoryRecord } = useHistoryContext()
  const {
    isEvaluatingAnswer,
    aiEvaluationResult,
    showEvaluation,
    evaluateAnswerWithAI,
    closeEvaluation,
    resetEvaluation
  } = useEvaluationContext()

  const [answerText, setAnswerText] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  // 答案草稿：按题目 ID 保存/恢复（500ms 防抖）
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftQidRef = useRef<string | null>(null)

  // 切题时恢复草稿
  useEffect(() => {
    if (currentQuestion) {
      const draft = localStorage.getItem(`ai_draft_${currentQuestion.id}`)
      setAnswerText(draft || '')
      draftQidRef.current = currentQuestion.id
    } else {
      setAnswerText('')
      draftQidRef.current = null
    }
  }, [currentQuestion?.id])

  // 输入变化时保存草稿
  useEffect(() => {
    const qid = draftQidRef.current
    if (!qid) return
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      if (answerText.trim()) {
        localStorage.setItem(`ai_draft_${qid}`, answerText)
      } else {
        localStorage.removeItem(`ai_draft_${qid}`)
      }
    }, 500)
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [answerText])

  // ref 避免闭包陷阱：始终持有 currentQuestions.length 最新值
  const questionsLenRef = useRef(currentQuestions.length)
  questionsLenRef.current = currentQuestions.length

  const handleQuestionGenerated = useCallback((q: import('../types').Question) => {
    addQuestion(q)
  }, [addQuestion])

  // getExistingTitles 内部用 ref 读取最新值，不需要 useMemo 缓存
  const existingTitles = getExistingTitles()

  const { isStreaming, streamingContent, streamingTitle, hasStarted, startStreaming, abortStream } = useQuestionStream({
    categoryId: selectedCategoryId,
    existingTitles,
    onQuestionGenerated: handleQuestionGenerated
  })

  // 分类切换时清空回答和评估，没有题目则自动生成
  useEffect(() => {
    setAnswerText('')
    resetEvaluation()
    abortStream()
    const t = setTimeout(() => {
      if (questionsLenRef.current === 0) {
        startStreaming()
      }
    }, 0)
    return () => clearTimeout(t)
  }, [selectedCategoryId])

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex >= questionsLenRef.current - 1) {
      startStreaming()
    } else {
      goNext()
    }
    setAnswerText('')
    resetEvaluation()
  }, [currentQuestionIndex, goNext, startStreaming, resetEvaluation])

  const handlePrevQuestion = useCallback(() => {
    goPrev()
    setAnswerText('')
    resetEvaluation()
  }, [goPrev, resetEvaluation])

  const handleToggleFavorite = useCallback(() => {
    if (!currentQuestion) return
    toggleFavorite(currentQuestion.id)
  }, [currentQuestion, toggleFavorite])

  const handleRefreshQuestion = useCallback(() => {
    refreshQuestion()
    setAnswerText('')
    resetEvaluation()
  }, [refreshQuestion, resetEvaluation])

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !answerText.trim()) return
    try {
      const evalResult = await evaluateAnswerWithAI(currentQuestion.content, answerText)
      addHistoryRecord(currentQuestion.id, answerText, evalResult ? {
        score: evalResult.score,
        correctAnswer: evalResult.correctAnswer,
        feedback: evalResult.feedback
      } : undefined)
    } catch {
      addHistoryRecord(currentQuestion.id, answerText)
      messageApi.error('评估失败，请检查后端服务是否正常')
    }
  }, [currentQuestion, answerText, addHistoryRecord, evaluateAnswerWithAI, messageApi])

  const handleClearAnswer = useCallback(() => {
    setAnswerText('')
    resetEvaluation()
  }, [resetEvaluation])

  return (
    <>
      {contextHolder}
      <div className="question-page-inner">
      <QuestionView
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        currentQuestions={currentQuestions}
        hasStarted={hasStarted}
        nextButtonText={currentQuestionIndex < currentQuestions.length - 1 ? '下一题' : '生成新题目'}
        isFavorite={currentQuestion ? isFavorite(currentQuestion.id) : false}
        isCodingCategory={isCodingCategory}
        streamingContent={streamingContent}
        streamingTitle={streamingTitle}
        isStreaming={isStreaming}
        onPrevQuestion={handlePrevQuestion}
        onNextQuestion={handleNextQuestion}
        onToggleFavorite={handleToggleFavorite}
        onRefreshQuestion={handleRefreshQuestion}
      />

      <AnswerArea
        answerText={answerText}
        isCodingCategory={isCodingCategory}
        isEvaluatingAnswer={isEvaluatingAnswer}
        isGeneratingQuestion={isStreaming}
        onAnswerChange={setAnswerText}
        onSubmitAnswer={handleSubmitAnswer}
        onClearAnswer={handleClearAnswer}
      />

      <EvaluationResult
        evaluationResult={aiEvaluationResult}
        visible={showEvaluation}
        onClose={closeEvaluation}
      />
      </div>
    </>
  )
}
