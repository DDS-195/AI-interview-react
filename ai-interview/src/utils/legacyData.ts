// 旧浏览器数据只在服务端确认导入后标记完成，保留原 key 供恢复。
import type { InterviewData, Question, FavoriteQuestion, HistoryRecord } from '../types'
import { getStored, setStored } from './browserStorage'

const MIGRATED_KEY = 'ai_interview_server_migrated'

function read(key: string): unknown {
  const raw = getStored(key)
  return raw ? JSON.parse(raw) : null
}

function entries(key: string): Record<string, unknown>[] {
  const value = read(key)
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item) => item && typeof item === 'object')
}

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim()
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

export function readLegacyData(): InterviewData | null {
  if (getStored(MIGRATED_KEY) === '1') {
    return null
  }
  const questions: Question[] = entries('ai_interview_questions')
    .filter(
      (q) => nonempty(q.id) && nonempty(q.title) && nonempty(q.content) && nonempty(q.categoryId)
    )
    .map((q) => ({
      id: q.id as string,
      categoryId: q.categoryId as string,
      title: q.title as string,
      content: q.content as string,
      difficulty: q.difficulty === 'easy' || q.difficulty === 'hard' ? q.difficulty : 'medium',
      type: q.type === 'code' || q.categoryId === 'coding' ? 'code' : 'text'
    }))
  const favorites: FavoriteQuestion[] = entries('ai_interview_favorites')
    .filter((f) => nonempty(f.questionId) && validDate(f.addedAt))
    .map((f) => ({ questionId: f.questionId as string, addedAt: f.addedAt as string }))
  const history: HistoryRecord[] = entries('ai_interview_history')
    .filter((r) => nonempty(r.questionId) && validDate(r.submittedAt))
    .map((r) => {
      const detail = read(`ai_history_detail_${r.submittedAt}`)
      const fields = detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : {}
      const record: HistoryRecord = {
        questionId: r.questionId as string,
        submittedAt: r.submittedAt as string,
        answer: typeof r.answer === 'string' ? r.answer : ''
      }
      if (
        typeof r.score === 'number' &&
        Number.isFinite(r.score) &&
        r.score >= 0 &&
        r.score <= 100
      ) {
        record.score = r.score
      }
      for (const key of ['correctAnswer', 'feedback'] as const) {
        const value = typeof r[key] === 'string' ? r[key] : fields[key]
        if (typeof value === 'string') {
          record[key] = value
        }
      }
      return record
    })
  return { questions, favorites, history }
}

export function markLegacyMigrated() {
  // 保留旧数据作为备份，标记仅在服务端成功接收后写入。
  setStored(MIGRATED_KEY, '1')
}
