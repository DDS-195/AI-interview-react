// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest'
import { readLegacyData, markLegacyMigrated } from '../src/utils/legacyData'
beforeEach(() => localStorage.clear())
it('旧浏览器数据合并拆分详情，保留真实 0 分', () => {
  const submittedAt = '2026-01-01T00:00:00.000Z'
  localStorage.setItem(
    'ai_interview_questions',
    JSON.stringify([{ id: 'q1', categoryId: 'react', title: '题目', content: '内容' }])
  )
  localStorage.setItem(
    'ai_interview_favorites',
    JSON.stringify([{ questionId: 'q1', addedAt: submittedAt }])
  )
  localStorage.setItem(
    'ai_interview_history',
    JSON.stringify([{ questionId: 'q1', answer: '回答', submittedAt, score: 0 }])
  )
  localStorage.setItem(
    'ai_history_detail_' + submittedAt,
    JSON.stringify({ feedback: '旧反馈', correctAnswer: '旧参考答案' })
  )
  const migrated = readLegacyData()
  expect(migrated?.questions[0].difficulty).toBe('medium')
  expect(migrated?.favorites[0].questionId).toBe('q1')
  expect(migrated?.history[0]).toMatchObject({
    score: 0,
    feedback: '旧反馈',
    correctAnswer: '旧参考答案'
  })
})
it('迁移标记防止已删除的旧记录重新导入，原备份保留', () => {
  localStorage.setItem('ai_interview_history', '[]')
  markLegacyMigrated()
  expect(readLegacyData()).toBeNull()
  expect(localStorage.getItem('ai_interview_history')).toBe('[]')
})
