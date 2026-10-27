// 区分下一题筛选与正在作答的题目，生成失败时保留原题和草稿。
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode
} from 'react'
import type { Question, QuestionMode } from '../types'
import { dataRequest } from '../utils/dataRequest'
import { getStored, setStored } from '../utils/browserStorage'
import {
  availableModes,
  CATEGORIES,
  canonicalCategoryId,
  categoryTopics,
  questionMode,
  QUESTION_MODES
} from '../utils/catalog'

interface QuestionContextType {
  questions: Question[]
  selectedCategoryId: string
  selectedTopicId: string
  selectedMode: QuestionMode
  selectedDifficulty: '' | Question['difficulty']
  categoryGenerationRequest: { id: number; categoryId: string } | null
  consumeCategoryGenerationRequest: (requestId: number) => void
  currentQuestionIndex: number
  currentQuestions: Question[]
  currentQuestion: Question | null
  isCodingCategory: boolean
  selectCategory: (categoryId: string) => void
  selectTopic: (topicId: string) => void
  selectMode: (mode: QuestionMode) => void
  selectDifficulty: (difficulty: '' | Question['difficulty']) => void
  nextQuestion: () => void
  prevQuestion: () => void
  refreshQuestion: () => void
  addQuestion: (question: Question) => void
  setCurrentQuestionIndex: (index: number) => void
  getExistingTitles: () => string[]
  getQuestionById: (id: string, signal?: AbortSignal) => Promise<Question>
  openQuestion: (question: Question) => void
  isRestoring: boolean
  restoreError: string
  retryRestore: () => void
}
const QuestionContext = createContext<QuestionContextType | null>(null)
const activeCategory = (question: Question) =>
  canonicalCategoryId(question.categoryId) || question.categoryId
function readActiveQuestion(): { id?: string; categoryId: string } | null {
  try {
    const value = JSON.parse(getStored('ai_interview_active_question') || 'null')
    if (
      !value ||
      typeof value.categoryId !== 'string' ||
      !value.categoryId ||
      value.categoryId.length > 100
    ) {
      return null
    }
    return {
      categoryId: value.categoryId,
      id: typeof value.id === 'string' && value.id.length <= 200 ? value.id : undefined
    }
  } catch {
    return null
  }
}
function readFilters() {
  const active = readActiveQuestion()
  const fallback = {
    categoryId: canonicalCategoryId(active?.categoryId || '') || 'html-css',
    topicId: '',
    mode: (['scenario', 'coding'].includes(active?.categoryId || '')
      ? active?.categoryId
      : 'theory') as QuestionMode,
    difficulty: '' as '' | Question['difficulty']
  }
  try {
    const saved = JSON.parse(getStored('ai_interview_question_filters') || 'null')
    if (!saved || !canonicalCategoryId(saved.categoryId)) {
      return fallback
    }
    const categoryId = canonicalCategoryId(saved.categoryId)!
    const topicId = categoryTopics(categoryId).some((topic) => topic.id === saved.topicId)
      ? (saved.topicId as string)
      : ''
    return {
      categoryId,
      topicId,
      mode: availableModes(categoryId, topicId).includes(saved.mode)
        ? (saved.mode as QuestionMode)
        : ('theory' as QuestionMode),
      difficulty: ['easy', 'medium', 'hard'].includes(saved.difficulty)
        ? (saved.difficulty as Question['difficulty'])
        : ('' as const)
    }
  } catch {
    return fallback
  }
}
export function QuestionProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [restoreTarget] = useState(readActiveQuestion)
  const [filters, setFilters] = useState(readFilters)
  // 只记录用户切换分类的操作；恢复题目、打开历史和筛选变化不创建请求。
  const [categoryGenerationRequest, setCategoryGenerationRequest] = useState<{
    id: number
    categoryId: string
  } | null>(null)
  const categoryRequestSequence = useRef(0)
  const selectedCategoryId = filters.categoryId
  const [displayCategoryId, setDisplayCategoryId] = useState(
    canonicalCategoryId(restoreTarget?.categoryId || '') ||
      restoreTarget?.categoryId ||
      selectedCategoryId
  )
  const [isRestoring, setIsRestoring] = useState(!!restoreTarget?.id)
  const [restoreError, setRestoreError] = useState('')
  const [restoreAttempt, setRestoreAttempt] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  // refs 保存回调需要的最新状态，避免异步函数读取旧渲染的闭包。
  const questionsRef = useRef(questions)
  questionsRef.current = questions
  const selectedRef = useRef(selectedCategoryId)
  selectedRef.current = selectedCategoryId
  const displayRef = useRef(displayCategoryId)
  displayRef.current = displayCategoryId
  const currentQuestions = useMemo(
    () => questions.filter((question) => activeCategory(question) === displayCategoryId),
    [questions, displayCategoryId]
  )
  const currentQuestion = currentQuestions[currentQuestionIndex] || null
  // 编辑器跟随正在作答的题目，不能跟随下一题的分类。
  const isCodingCategory = currentQuestion?.type === 'code'
  // 只有用户切换到另一分类才创建临时生成请求；刷新和恢复旧题不重放。
  const selectCategory = useCallback((id: string) => {
    const categoryId = canonicalCategoryId(id)
    if (!categoryId || selectedRef.current === categoryId) {
      return
    }
    selectedRef.current = categoryId
    setFilters((previous) => ({
      ...previous,
      categoryId,
      topicId: '',
      mode: availableModes(categoryId).includes(previous.mode) ? previous.mode : 'theory'
    }))
    setCategoryGenerationRequest({ id: ++categoryRequestSequence.current, categoryId })
  }, [])
  const consumeCategoryGenerationRequest = useCallback((requestId: number) => {
    setCategoryGenerationRequest((previous) => (previous?.id === requestId ? null : previous))
  }, [])
  const selectTopic = useCallback(
    (topicId: string) =>
      setFilters((previous) =>
        !topicId || categoryTopics(previous.categoryId).some((topic) => topic.id === topicId)
          ? {
              ...previous,
              topicId,
              mode: availableModes(previous.categoryId, topicId).includes(previous.mode)
                ? previous.mode
                : 'theory'
            }
          : previous
      ),
    []
  )
  const selectMode = useCallback((mode: QuestionMode) => {
    if (QUESTION_MODES.some((item) => item.id === mode)) {
      setFilters((previous) =>
        availableModes(previous.categoryId, previous.topicId).includes(mode)
          ? { ...previous, mode }
          : previous
      )
    }
  }, [])
  const selectDifficulty = useCallback((difficulty: '' | Question['difficulty']) => {
    if (['', 'easy', 'medium', 'hard'].includes(difficulty)) {
      setFilters((previous) => ({ ...previous, difficulty }))
    }
  }, [])
  const nextQuestion = useCallback(() => {
    const count = questionsRef.current.filter(
      (question) => activeCategory(question) === displayRef.current
    ).length
    setCurrentQuestionIndex((previous) => Math.min(previous + 1, Math.max(0, count - 1)))
  }, [])
  const prevQuestion = useCallback(
    () => setCurrentQuestionIndex((previous) => Math.max(0, previous - 1)),
    []
  )
  const refreshQuestion = useCallback(() => {
    const count = questionsRef.current.filter(
      (question) => activeCategory(question) === displayRef.current
    ).length
    if (count) {
      setCurrentQuestionIndex(Math.floor(Math.random() * count))
    }
  }, [])
  // 新题确认成功后才切换展示分类，生成中的筛选变化不会提前覆盖原题。
  const addQuestion = useCallback((question: Question) => {
    setRestoreError('')
    const active = questionsRef.current.some((item) => item.id === question.id)
      ? questionsRef.current
      : [...questionsRef.current, question]
    questionsRef.current = active
    setQuestions(active)
    const categoryId = activeCategory(question)
    displayRef.current = categoryId
    setDisplayCategoryId(categoryId)
    setCurrentQuestionIndex(
      active
        .filter((item) => activeCategory(item) === categoryId)
        .findIndex((item) => item.id === question.id)
    )
  }, [])
  const getExistingTitles = useCallback(
    () =>
      questionsRef.current
        .filter((question) => activeCategory(question) === selectedRef.current)
        .map((question) => question.title)
        .slice(-40),
    []
  )
  const getQuestionById = useCallback(async (id: string, signal?: AbortSignal) => {
    const active = questionsRef.current.find((question) => question.id === id)
    return (
      active ||
      dataRequest<Question>(`/questions/${encodeURIComponent(id)}`, 'GET', undefined, signal)
    )
  }, [])
  const openQuestion = useCallback(
    (question: Question) => {
      const categoryId = canonicalCategoryId(question.categoryId)
      setCategoryGenerationRequest(null)
      setFilters((previous) => {
        const nextCategory = categoryId || previous.categoryId
        const topicId =
          categoryId && categoryTopics(categoryId).some((topic) => topic.id === question.topicId)
            ? question.topicId!
            : ''
        const mode = questionMode(question)
        return {
          ...previous,
          categoryId: nextCategory,
          topicId,
          mode: availableModes(nextCategory, topicId).includes(mode) ? mode : 'theory'
        }
      })
      addQuestion(question)
    },
    [addQuestion]
  )
  useEffect(() => {
    if (!restoreTarget?.id) {
      return
    }
    const controller = new AbortController()
    setIsRestoring(true)
    setRestoreError('')
    getQuestionById(restoreTarget.id, controller.signal)
      .then((question) => {
        if (!controller.signal.aborted) {
          addQuestion(question)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRestoreError(error instanceof Error ? error.message : '题目恢复失败')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsRestoring(false)
        }
      })
    return () => controller.abort()
  }, [restoreTarget, restoreAttempt, getQuestionById, addQuestion])
  useEffect(() => {
    if (!isRestoring && !restoreError) {
      setStored(
        'ai_interview_active_question',
        JSON.stringify({
          categoryId: currentQuestion?.categoryId || displayCategoryId,
          id: currentQuestion?.id
        })
      )
    }
  }, [currentQuestion, displayCategoryId, isRestoring, restoreError])
  useEffect(() => {
    setStored('ai_interview_question_filters', JSON.stringify(filters))
  }, [filters])
  const retryRestore = useCallback(() => setRestoreAttempt((value) => value + 1), [])
  const value = useMemo(
    () => ({
      questions,
      selectedCategoryId,
      selectedTopicId: filters.topicId,
      selectedMode: filters.mode,
      selectedDifficulty: filters.difficulty,
      categoryGenerationRequest,
      consumeCategoryGenerationRequest,
      currentQuestionIndex,
      currentQuestions,
      currentQuestion,
      isCodingCategory,
      selectCategory,
      selectTopic,
      selectMode,
      selectDifficulty,
      nextQuestion,
      prevQuestion,
      refreshQuestion,
      addQuestion,
      setCurrentQuestionIndex,
      getExistingTitles,
      getQuestionById,
      openQuestion,
      isRestoring,
      restoreError,
      retryRestore
    }),
    [
      questions,
      selectedCategoryId,
      filters,
      categoryGenerationRequest,
      consumeCategoryGenerationRequest,
      currentQuestionIndex,
      currentQuestions,
      currentQuestion,
      isCodingCategory,
      selectCategory,
      selectTopic,
      selectMode,
      selectDifficulty,
      nextQuestion,
      prevQuestion,
      refreshQuestion,
      addQuestion,
      getExistingTitles,
      getQuestionById,
      openQuestion,
      isRestoring,
      restoreError,
      retryRestore
    ]
  )
  return <QuestionContext.Provider value={value}>{children}</QuestionContext.Provider>
}
export function useQuestionContext() {
  const context = useContext(QuestionContext)
  if (!context) {
    throw new Error('useQuestionContext must be used within QuestionProvider')
  }
  return context
}
export { CATEGORIES }
