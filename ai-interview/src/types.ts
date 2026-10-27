// 前端业务数据契约；网络 JSON 仍需运行时校验，不能只依赖 TypeScript 类型。
export interface Category {
  id: string
  name: string
}

export interface RubricPoint {
  id: string
  description: string
  weight: number
  expected: string
}
export interface EvaluationCriterion {
  id: string
  description: string
  maxPoints: number
  points: number
  verdict: 'met' | 'partial' | 'missed' | 'incorrect'
  evidence: string
  explanation: string
  sourceIds?: string[]
}
export interface KnowledgeEvidence {
  id: string
  documentId: string
  documentVersionId: string
  revision: number
  title: string
  url: string
  heading: string
  text: string
  technicalVersion: string
  contentHash: string
  kind: string
}
export interface KnowledgeSnapshot {
  status: 'grounded' | 'unavailable'
  method: 'semantic' | 'hybrid' | 'keyword'
  retrievedAt: string
  indexProfile: string | null
  retrievalVersion: string
  reason?: string
  evidence: KnowledgeEvidence[]
}
export interface AssessmentMetadata {
  mode?: QuestionMode
  topicId?: string
  codeLanguage?: CodeLanguage
  topic?: string
  technicalVersion?: string
  promptVersion?: string
  questionPromptVersion?: string
  model?: string
  referenceStatus?: 'verified' | 'generated' | 'grounded'
  sources?: { title: string; url: string }[]
  knowledgeSnapshot?: KnowledgeSnapshot
}
export interface Question extends AssessmentMetadata {
  rubricSources?: Record<string, string[]>
  rubric?: RubricPoint[]
  optionalPoints?: string[]
  referenceAnswer?: string
  id: string
  categoryId: string
  title: string
  content: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'text' | 'code'
}

export interface HistoryRecord extends AssessmentMetadata {
  questionSnapshot?: Question
  criteria?: EvaluationCriterion[]
  suggestions?: string[]
  uncertainties?: string[]
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

export interface InterviewData {
  questions: Question[]
  favorites: FavoriteQuestion[]
  history: HistoryRecord[]
  reviewMarks?: {
    questionId: string
    status: 'pending' | 'completed'
    baselineSubmission: string | null
    updatedAt: string
  }[]
}

export interface DataCounts {
  questions: number
  favorites: number
  history: number
}

export interface DataSummary {
  counts: DataCounts
  favorites: FavoriteQuestion[]
}

export interface DataChange {
  counts: DataCounts
  favorite?: FavoriteQuestion
  removedFavoriteId?: string
  clearFavorites?: boolean
}

export interface ListQuestion {
  id: string
  title: string
  categoryId: string
}

export interface HistoryListItem {
  questionId: string
  submittedAt: string
  score?: number
  preview: string
  question: ListQuestion | null
}

export interface FavoriteListItem extends FavoriteQuestion {
  preview: string
  question: ListQuestion | null
}

export interface PagedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  distribution: { categoryId: string; value: number }[]
}

export interface HistoryDetail {
  record: HistoryRecord
  question: Question | null
}

export interface AIQuestion {
  title: string
  content: string
  category: string
  difficulty?: string
  topic?: string
}

export type QuestionMode = 'theory' | 'scenario' | 'coding' | 'debug'
export type CodeLanguage = 'javascript' | 'typescript' | 'html' | 'css'

export interface AIEvaluation extends AssessmentMetadata {
  submittedAt?: string
  criteria?: EvaluationCriterion[]
  uncertainties?: string[]
  score: number
  feedback: string
  correctAnswer?: string
  suggestions?: string[]
}

export interface QuestionListItem extends ListQuestion {
  preview: string
  difficulty: Question['difficulty']
  mode: QuestionMode
  topic: string | null
  topicId: string | null
  attempts: number
  scoredAttempts: number
  firstScore: number | null
  latestScore: number | null
  latestSubmittedAt: string | null
  improvement: number | null
  reviewStatus: 'pending' | 'completed' | null
  reviewSource: 'manual' | 'score'
  lossPoints: Pick<EvaluationCriterion, 'description' | 'points' | 'maxPoints' | 'explanation'>[]
}
export interface QuestionListData {
  items: QuestionListItem[]
  total: number
  page: number
  pageSize: number
  reviewThreshold: number
}
export interface TopicProgress {
  id: string
  name: string
  generatedQuestions: number
  practicedQuestions: number
  attempts: number
  scoredAttempts: number
  pendingReviews: number
  averageScore: number | null
}
export interface CategoryProgress {
  id: string
  name: string
  optional: boolean
  generatedQuestions: number
  practicedQuestions: number
  coveredTopics: number
  totalTopics: number
  topics: TopicProgress[]
}
export interface LearningOverview {
  skillProfile?: {
    version: string
    categories: {
      categoryId: string
      categoryName: string
      score: number | null
      sampleSize: number
    }[]
  }
  totals: {
    generatedQuestions: number
    practicedQuestions: number
    attempts: number
    scoredAttempts: number
    pendingReviews: number
    averageLatestScore: number | null
    averageScore: number | null
    bestScore: number | null
    coveredTopics: number
    totalTopics: number
  }
  categories: CategoryProgress[]
  trend: { date: string; attempts: number; scoredAttempts: number; averageScore: number | null }[]
  modes: { mode: QuestionMode; attempts: number; averageScore: number | null }[]
  weakTopics: (TopicProgress & { categoryId: string; categoryName: string })[]
  reviewThreshold: number
  timeZone: string
}
