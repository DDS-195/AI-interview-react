// 练习协调层：组合生成、草稿和评分；成功结果由后端先保存，页面只刷新摘要。
import { useEffect, useCallback, useRef, useState } from 'react'
import { message, Alert, Button, Spin } from 'antd'
import QuestionView from '../components/QuestionView'
import AnswerArea from '../components/AnswerArea'
import EvaluationResult from '../components/EvaluationResult'
import { useQuestionContext } from '../contexts/QuestionContext'
import { useFavoriteContext } from '../contexts/FavoriteContext'
import { useEvaluationContext } from '../contexts/EvaluationContext'
import { useQuestionStream } from '../hooks/useQuestionStream'
import { useAnswerDraft } from '../hooks/useAnswerDraft'
import { useDataContext } from '../contexts/DataContext'
import QuestionFilters from '../components/QuestionFilters'
import { canonicalCategoryId, questionMode } from '../utils/catalog'

export default function QuestionPage() {
  const {
    selectedCategoryId,
    selectedTopicId,
    selectedMode,
    selectedDifficulty,
    categoryGenerationRequest,
    consumeCategoryGenerationRequest,
    currentQuestion,
    currentQuestionIndex,
    currentQuestions,
    isCodingCategory,
    addQuestion,
    nextQuestion: goNext,
    prevQuestion: goPrev,
    refreshQuestion,
    getExistingTitles,
    isRestoring,
    restoreError,
    retryRestore
  } = useQuestionContext()

  const { toggleFavorite, isFavorite } = useFavoriteContext()
  const { refresh, mutate } = useDataContext()
  const [isMarkingReview, setIsMarkingReview] = useState(false)
  const markingReview = useRef(false)
  const {
    isEvaluatingAnswer,
    aiEvaluationResult,
    showEvaluation,
    evaluateAnswerWithAI,
    closeEvaluation,
    resetEvaluation
  } = useEvaluationContext()

  const { answerText, setAnswerText } = useAnswerDraft(currentQuestion?.id)
  const [messageApi, contextHolder] = message.useMessage()

  // ref 避免闭包陷阱：始终持有 currentQuestions.length 最新值
  const questionsLenRef = useRef(currentQuestions.length)
  questionsLenRef.current = currentQuestions.length

  const handleQuestionGenerated = useCallback(
    (q: import('../types').Question) => {
      addQuestion(q)
      void refresh().catch(() => messageApi.error('题目已保存，列表刷新失败，请重新打开列表'))
    },
    [addQuestion, refresh, messageApi]
  )

  // getExistingTitles 内部用 ref 读取最新值，不需要 useMemo 缓存
  const existingTitles = getExistingTitles()

  const {
    isStreaming,
    streamingContent,
    streamingTitle,
    hasStarted,
    error: streamError,
    startStreaming,
    abortStream
  } = useQuestionStream({
    categoryId: selectedCategoryId,
    mode: selectedMode,
    topicId: selectedTopicId || undefined,
    difficulty: selectedDifficulty || undefined,
    existingTitles,
    onQuestionGenerated: handleQuestionGenerated
  })

  // 范围变化立即取消旧请求；新题成功前保留原题和草稿。
  useEffect(() => {
    abortStream()
  }, [selectedCategoryId, selectedTopicId, selectedMode, selectedDifficulty, abortStream])
  useEffect(() => {
    if (
      !categoryGenerationRequest ||
      categoryGenerationRequest.categoryId !== selectedCategoryId ||
      isRestoring
    ) {
      return
    }
    abortStream()
    // 短暂合并连续点击，并用最终分类和筛选生成；请求不持久化，刷新不会自动出题。
    const timer = setTimeout(() => {
      consumeCategoryGenerationRequest(categoryGenerationRequest.id)
      startStreaming()
    }, 250)
    return () => clearTimeout(timer)
  }, [
    categoryGenerationRequest,
    selectedCategoryId,
    selectedTopicId,
    selectedMode,
    selectedDifficulty,
    isRestoring,
    consumeCategoryGenerationRequest,
    startStreaming,
    abortStream
  ])
  useEffect(() => {
    resetEvaluation()
  }, [currentQuestion?.id, resetEvaluation])
  // 当前题和下一题范围可以暂时不同；按钮据此决定翻旧题还是生成新题。
  const scopeChanged =
    !currentQuestion ||
    canonicalCategoryId(currentQuestion.categoryId) !== selectedCategoryId ||
    questionMode(currentQuestion) !== (selectedMode || 'theory') ||
    Boolean(selectedTopicId && currentQuestion.topicId !== selectedTopicId) ||
    Boolean(selectedDifficulty && currentQuestion.difficulty !== selectedDifficulty)

  const handleNextQuestion = useCallback(() => {
    if (isRestoring || isStreaming) {
      return
    }
    if (scopeChanged || currentQuestionIndex >= questionsLenRef.current - 1) {
      startStreaming()
    } else {
      goNext()
    }
    resetEvaluation()
  }, [
    isRestoring,
    isStreaming,
    scopeChanged,
    currentQuestionIndex,
    goNext,
    startStreaming,
    resetEvaluation
  ])

  const handlePrevQuestion = useCallback(() => {
    goPrev()
    resetEvaluation()
  }, [goPrev, resetEvaluation])

  const handleToggleFavorite = useCallback(() => {
    if (!currentQuestion) {
      return
    }
    toggleFavorite(currentQuestion.id)
  }, [currentQuestion, toggleFavorite])

  const handleRefreshQuestion = useCallback(() => {
    refreshQuestion()
    resetEvaluation()
  }, [refreshQuestion, resetEvaluation])

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !answerText.trim()) {
      return
    }
    try {
      const evalResult = await evaluateAnswerWithAI(currentQuestion.id, answerText)
      if (!evalResult) {
        return
      }
      // 后端已将成绩和完整历史一起保存；刷新列表不再重复创建记录。
      void refresh().catch(() => messageApi.error('评分已保存，历史列表刷新失败，请重新打开历史'))
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '评估失败，请检查后端服务是否正常')
    }
  }, [currentQuestion, answerText, evaluateAnswerWithAI, messageApi, refresh])

  const handleClearAnswer = useCallback(() => {
    setAnswerText('')
    resetEvaluation()
  }, [setAnswerText, resetEvaluation])

  const handleMarkReview = useCallback(async () => {
    if (!currentQuestion || markingReview.current) {
      return
    }
    markingReview.current = true
    setIsMarkingReview(true)
    try {
      await mutate(`/reviews/${encodeURIComponent(currentQuestion.id)}`, 'PUT', {
        status: 'pending'
      })
      messageApi.success('已加入错题复习')
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '标记复习失败')
    } finally {
      markingReview.current = false
      setIsMarkingReview(false)
    }
  }, [currentQuestion, mutate, messageApi])

  return (
    <>
      {contextHolder}
      <div className="question-page-inner">
        <QuestionFilters />
        {isRestoring && (
          <Spin tip="正在恢复上次题目…">
            <div style={{ height: 80 }} />
          </Spin>
        )}
        {restoreError && (
          <Alert
            type="error"
            showIcon
            message="上次题目恢复失败"
            description={restoreError}
            action={<Button onClick={retryRestore}>重试</Button>}
          />
        )}
        {streamError && (
          <Alert
            type="error"
            showIcon
            message="题目生成失败"
            description={streamError}
            action={<Button onClick={startStreaming}>重新生成</Button>}
          />
        )}
        <QuestionView
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          currentQuestions={currentQuestions}
          hasStarted={hasStarted}
          nextButtonText={
            !scopeChanged && currentQuestionIndex < currentQuestions.length - 1
              ? '下一题'
              : '生成新题目'
          }
          isFavorite={currentQuestion ? isFavorite(currentQuestion.id) : false}
          isCodingCategory={isStreaming ? selectedMode === 'coding' : isCodingCategory}
          streamingContent={streamingContent}
          streamingTitle={streamingTitle}
          isStreaming={isStreaming}
          isRestoring={isRestoring}
          onPrevQuestion={handlePrevQuestion}
          onNextQuestion={handleNextQuestion}
          onToggleFavorite={handleToggleFavorite}
          onRefreshQuestion={handleRefreshQuestion}
          onMarkReview={() => void handleMarkReview()}
          isMarkingReview={isMarkingReview}
        />

        <AnswerArea
          answerText={answerText}
          isCodingCategory={isCodingCategory}
          codeLanguage={currentQuestion?.codeLanguage}
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
