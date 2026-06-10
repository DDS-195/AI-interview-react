import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect, type ReactNode } from 'react'
import type { Question, Category } from '../types'
import { saveQuestions, loadQuestions } from '../utils/localStorage'
import { uploadCollection } from '../utils/cloudSync'

interface QuestionContextType {
  questions: Question[]
  selectedCategoryId: string
  currentQuestionIndex: number
  currentQuestions: Question[]
  currentQuestion: Question | null
  isCodingCategory: boolean
  selectCategory: (categoryId: string) => void
  nextQuestion: () => void
  prevQuestion: () => void
  refreshQuestion: () => void
  addQuestion: (q: Question) => void
  setCurrentQuestionIndex: (index: number) => void
  getExistingTitles: () => string[]
  getQuestionById: (id: string) => Question | undefined
  getAllQuestions: () => Question[]
}

const QuestionContext = createContext<QuestionContextType | null>(null)

const CATEGORIES: Category[] = [
  { id: 'html-css', name: 'HTML/CSS' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'vue', name: 'Vue' },
  { id: 'react', name: 'React' },
  { id: 'jquery', name: 'jQuery' },
  { id: 'nodejs', name: 'Node.js' },
  { id: 'es6', name: 'ES6+' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'performance', name: '性能优化' },
  { id: 'network', name: '计算机网络' },
  { id: 'browser', name: '浏览器原理' },
  { id: 'engineering', name: '工程化' },
  { id: 'git', name: 'Git' },
  { id: 'scenario', name: '场景应用题' },
  { id: 'coding', name: '手写代码题' },
]

function isValidQuestion(q: unknown): q is Question {
  return !!q && typeof q === 'object'
    && typeof (q as Question).id === 'string'
    && typeof (q as Question).title === 'string'
    && typeof (q as Question).content === 'string'
}

export function QuestionProvider({ children }: { children: ReactNode }) {
  // 缓存池：存 localStorage 里的全部题目，收藏/历史用它查
  const questionCacheRef = useRef<Map<string, Question>>(new Map())
  useEffect(() => {
    const saved = loadQuestions()
    if (saved && Array.isArray(saved)) {
      saved.filter(isValidQuestion).forEach(q => questionCacheRef.current.set(q.id, q))
    }
  }, [])

  // 活跃列表：当前会话的题目，启动时空
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('html-css')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // 活跃题目变化时同步到缓存和持久化
  useEffect(() => {
    questions.forEach(q => questionCacheRef.current.set(q.id, q))
    saveQuestions(Array.from(questionCacheRef.current.values()))
    uploadCollection('questions', Array.from(questionCacheRef.current.values()))
  }, [questions])

  // refs 避免闭包陷阱
  const questionsRef = useRef(questions)
  questionsRef.current = questions
  const selectedRef = useRef(selectedCategoryId)
  selectedRef.current = selectedCategoryId

  const currentQuestions = useMemo(
    () => questions.filter(q => q.categoryId === selectedCategoryId),
    [questions, selectedCategoryId]
  )

  const currentQuestion = currentQuestions[currentQuestionIndex] || null
  const isCodingCategory = selectedCategoryId === 'coding'

  const selectCategory = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setCurrentQuestionIndex(0)
  }, [])

  const nextQuestion = useCallback(() => {
    const qs = questionsRef.current
    const cid = selectedRef.current
    const catQs = qs.filter(q => q.categoryId === cid)
    setCurrentQuestionIndex(prev => (prev < catQs.length - 1 ? prev + 1 : prev))
  }, [])

  const prevQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1))
  }, [])

  const refreshQuestion = useCallback(() => {
    const qs = questionsRef.current
    const cid = selectedRef.current
    const catQs = qs.filter(q => q.categoryId === cid)
    if (catQs.length === 0) return
    setCurrentQuestionIndex(Math.floor(Math.random() * catQs.length))
  }, [])

  const addQuestion = useCallback((q: Question) => {
    setQuestions(prev => [...prev, q])
    // 延迟到下一帧计算 index，避免 setState 中嵌套 setState
    const catQs = [...questionsRef.current, q].filter(item => item.categoryId === q.categoryId)
    setCurrentQuestionIndex(catQs.length - 1)
  }, [])

  const getExistingTitles = useCallback(() => {
    return questionsRef.current
      .filter(q => q.categoryId === selectedRef.current)
      .map(q => q.title)
  }, [])

  const getQuestionById = useCallback((id: string) => {
    // 先查活跃列表，再查缓存
    const active = questionsRef.current.find(q => q.id === id)
    if (active) return active
    return questionCacheRef.current.get(id)
  }, [])

  const getAllQuestions = useCallback(() => {
    return Array.from(questionCacheRef.current.values())
  }, [])

  const value = useMemo(() => ({
    questions,
    selectedCategoryId,
    currentQuestionIndex,
    currentQuestions,
    currentQuestion,
    isCodingCategory,
    selectCategory,
    nextQuestion,
    prevQuestion,
    refreshQuestion,
    addQuestion,
    setCurrentQuestionIndex,
    getExistingTitles,
    getQuestionById,
    getAllQuestions,
  }), [
    questions,
    selectedCategoryId,
    currentQuestionIndex,
    currentQuestions,
    currentQuestion,
    isCodingCategory,
    selectCategory,
    nextQuestion,
    prevQuestion,
    refreshQuestion,
    addQuestion,
    setCurrentQuestionIndex,
    getExistingTitles,
    getQuestionById,
    getAllQuestions,
  ])

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  )
}

export function useQuestionContext() {
  const ctx = useContext(QuestionContext)
  if (!ctx) throw new Error('useQuestionContext must be used within QuestionProvider')
  return ctx
}

export { CATEGORIES }
