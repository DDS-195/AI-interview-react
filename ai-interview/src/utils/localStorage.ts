const FAVORITES_KEY = 'ai_interview_favorites'
const HISTORY_KEY = 'ai_interview_history'
const QUESTIONS_KEY = 'ai_interview_questions'

export function saveToLocalStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`保存到localStorage失败: ${key}`, error)
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key)
    if (data) {
      return JSON.parse(data) as T
    }
  } catch (error) {
    console.error(`从localStorage加载失败: ${key}`, error)
  }
  return null
}

// 延迟写入：每个 key 独立 timer，避免 A key 的保存取消 B key 的定时器
const deferredTimers = new Map<string, ReturnType<typeof setTimeout>>()
export function saveDeferred(key: string, data: unknown) {
  const existing = deferredTimers.get(key)
  if (existing !== undefined) clearTimeout(existing)
  deferredTimers.set(key, setTimeout(() => {
    saveToLocalStorage(key, data)
    deferredTimers.delete(key)
  }, 300))
}

export function saveFavorites(favorites: unknown[]) {
  saveDeferred(FAVORITES_KEY, favorites)
}

export function loadFavorites(): unknown[] | null {
  return loadFromLocalStorage<unknown[]>(FAVORITES_KEY)
}

export function saveHistory(history: unknown[]) {
  saveDeferred(HISTORY_KEY, history)
}

export function loadHistory(): unknown[] | null {
  return loadFromLocalStorage<unknown[]>(HISTORY_KEY)
}

// 历史记录详情（大字段拆分存储）
const HISTORY_DETAIL_PREFIX = 'ai_history_detail_'
export function saveHistoryDetail(submittedAt: string, detail: { correctAnswer?: string; feedback?: string }) {
  saveToLocalStorage(HISTORY_DETAIL_PREFIX + submittedAt, detail)
}
export function loadHistoryDetail(submittedAt: string): { correctAnswer?: string; feedback?: string } | null {
  return loadFromLocalStorage<{ correctAnswer?: string; feedback?: string }>(HISTORY_DETAIL_PREFIX + submittedAt)
}
export function removeHistoryDetail(submittedAt: string) {
  try { localStorage.removeItem(HISTORY_DETAIL_PREFIX + submittedAt) } catch {}
}

export function saveQuestions(questions: unknown[]) {
  saveDeferred(QUESTIONS_KEY, questions)
}

export function loadQuestions(): unknown[] | null {
  return loadFromLocalStorage<unknown[]>(QUESTIONS_KEY)
}
