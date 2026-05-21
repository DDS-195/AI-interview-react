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

  // ref 避免 handleNextQuestion 依赖 currentQuestions.length
  const questionsLenRef = useRef(currentQuestions.length)
  questionsLenRef.current = currentQuestions.length

  const handleQuestionGenerated = useCallback((q: import('../types').Question) => {
    addQuestion(q)
  }, [addQuestion])

  // getExistingTitles 内部用 ref 读取最新值，不需要 useMemo 缓存
  const existingTitles = getExistingTitles()

  const { isStreaming, streamingContent, streamingTitle, hasStarted, startStreaming } = useQuestionStream({
    categoryId: selectedCategoryId,
    existingTitles,
    onQuestionGenerated: handleQuestionGenerated
  })

  // 分类切换时清空回答和评估，没有题目则自动生成
  useEffect(() => {
    setAnswerText('')
    resetEvaluation()
    if (currentQuestions.length === 0 && !isStreaming) {
      startStreaming()
    }
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
    addHistoryRecord(currentQuestion.id, answerText)
    try {
      await evaluateAnswerWithAI(currentQuestion.content, answerText)
    } catch {
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
      <QuestionView
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        currentQuestions={currentQuestions}
        hasStarted={hasStarted}
        nextButtonText={currentQuestionIndex < currentQuestions.length - 1 ? '下一题' : '生成新题目'}
        isFavorite={currentQuestion ? isFavorite(currentQuestion.id) : false}
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
    </>
  )
}
