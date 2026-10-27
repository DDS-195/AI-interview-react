// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { QuestionProvider, useQuestionContext } from '../src/contexts/QuestionContext'
import type { Question } from '../src/types'
const mocks = vi.hoisted(() => ({ mutate: vi.fn() }))
vi.mock('../src/contexts/DataContext', () => ({ useDataContext: () => ({ mutate: mocks.mutate }) }))
const wrapper = ({ children }: { children: ReactNode }) => (
  <QuestionProvider>{children}</QuestionProvider>
)
const question = {
  id: 'q-restored',
  categoryId: 'react',
  title: '旧题',
  content: '原题',
  difficulty: 'medium',
  type: 'text'
}
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  mocks.mutate.mockReset()
})

it('刷新恢复上次题目及分类，恢复期间不请求付费出题', async () => {
  localStorage.setItem(
    'ai_interview_active_question',
    JSON.stringify({ id: question.id, categoryId: 'react' })
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(question)))
  const { result } = renderHook(useQuestionContext, { wrapper })
  expect(result.current.isRestoring).toBe(true)
  await waitFor(() => expect(result.current.currentQuestion?.id).toBe(question.id))
  expect(result.current.selectedCategoryId).toBe('react')
  expect(result.current.isRestoring).toBe(false)
  expect(mocks.mutate).not.toHaveBeenCalled()
})
it('恢复失败提供重试，并保留原题标识供恢复', async () => {
  localStorage.setItem(
    'ai_interview_active_question',
    JSON.stringify({ id: question.id, categoryId: 'react' })
  )
  const fetcher = vi
    .fn()
    .mockRejectedValueOnce(new Error('服务暂不可用'))
    .mockResolvedValueOnce(Response.json(question))
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(useQuestionContext, { wrapper })
  await waitFor(() => expect(result.current.restoreError).toBe('服务暂不可用'))
  act(() => result.current.retryRestore())
  await waitFor(() => expect(result.current.currentQuestion?.id).toBe(question.id))
  expect(result.current.restoreError).toBe('')
})

it('分类切换在新题生成前保留当前题目和代码编辑器类型', () => {
  const { result } = renderHook(useQuestionContext, { wrapper })
  const code = { ...question, type: 'code', mode: 'coding', topicId: 'react:effects' } as Question
  act(() => result.current.openQuestion(code))
  act(() => {
    result.current.selectCategory('security')
    result.current.selectMode('scenario')
  })
  expect(result.current.currentQuestion).toEqual(code)
  expect(result.current.selectedCategoryId).toBe('security')
  expect(result.current.selectedMode).toBe('scenario')
  expect(result.current.isCodingCategory).toBe(true)
  expect(JSON.parse(localStorage.getItem('ai_interview_active_question')!)).toMatchObject({
    id: code.id,
    categoryId: 'react'
  })
})

it('只有实际切换分类才创建生成请求，快速切换只保留最后请求', () => {
  const { result } = renderHook(useQuestionContext, { wrapper })
  expect(result.current.categoryGenerationRequest).toBeNull()
  act(() => result.current.selectCategory('react'))
  const first = result.current.categoryGenerationRequest!
  expect(first.categoryId).toBe('react')
  act(() => {
    result.current.selectCategory('react')
    result.current.selectCategory('invalid')
  })
  expect(result.current.categoryGenerationRequest).toBe(first)
  act(() => {
    result.current.selectCategory('vue')
    result.current.selectCategory('security')
  })
  const latest = result.current.categoryGenerationRequest!
  expect(latest.categoryId).toBe('security')
  act(() => result.current.consumeCategoryGenerationRequest(first.id))
  expect(result.current.categoryGenerationRequest).toBe(latest)
  act(() => result.current.consumeCategoryGenerationRequest(latest.id))
  expect(result.current.categoryGenerationRequest).toBeNull()
})

it('刷新和打开历史题不创建自动出题请求，打开原题取消待生成请求', () => {
  const first = renderHook(useQuestionContext, { wrapper })
  act(() => first.result.current.selectCategory('vue'))
  first.unmount()
  const second = renderHook(useQuestionContext, { wrapper })
  expect(second.result.current.selectedCategoryId).toBe('vue')
  expect(second.result.current.categoryGenerationRequest).toBeNull()
  act(() => second.result.current.selectCategory('security'))
  expect(second.result.current.categoryGenerationRequest).not.toBeNull()
  act(() => second.result.current.openQuestion(question as Question))
  expect(second.result.current.categoryGenerationRequest).toBeNull()
  expect(second.result.current.currentQuestion?.id).toBe(question.id)
})
it('跨领域不能沿用旧知识点，非法知识点被忽略，筛选在刷新后保留', () => {
  const first = renderHook(useQuestionContext, { wrapper })
  act(() => {
    first.result.current.selectCategory('react')
    first.result.current.selectTopic('react:effects')
    first.result.current.selectMode('debug')
    first.result.current.selectDifficulty('hard')
  })
  expect(first.result.current.selectedTopicId).toBe('react:effects')
  first.unmount()
  const second = renderHook(useQuestionContext, { wrapper })
  expect(second.result.current.selectedMode).toBe('debug')
  expect(second.result.current.selectedDifficulty).toBe('hard')
  act(() => second.result.current.selectCategory('security'))
  expect(second.result.current.selectedTopicId).toBe('')
  act(() => second.result.current.selectTopic('react:effects'))
  expect(second.result.current.selectedTopicId).toBe('')
})
it('旧ES6题映射到JavaScript筛选，原分类、题干和ID保持不变', async () => {
  const legacy = { ...question, categoryId: 'es6' }
  localStorage.setItem(
    'ai_interview_active_question',
    JSON.stringify({ id: legacy.id, categoryId: 'es6' })
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(legacy)))
  const { result } = renderHook(useQuestionContext, { wrapper })
  await waitFor(() => expect(result.current.currentQuestion?.id).toBe(legacy.id))
  expect(result.current.selectedCategoryId).toBe('javascript')
  expect(result.current.currentQuestion).toEqual(legacy)
})
it('旧手写题可以恢复，不能将其知识领域擅自归为某个新分类', async () => {
  const legacy = { ...question, categoryId: 'coding', type: 'code' }
  localStorage.setItem(
    'ai_interview_active_question',
    JSON.stringify({ id: legacy.id, categoryId: legacy.categoryId })
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(legacy)))
  const { result } = renderHook(useQuestionContext, { wrapper })
  await waitFor(() => expect(result.current.currentQuestion?.id).toBe(legacy.id))
  expect(result.current.selectedMode).toBe('coding')
  expect(result.current.currentQuestion?.categoryId).toBe('coding')
  expect(result.current.isCodingCategory).toBe(true)
})

it('概念型知识点禁用手写与排错，切换时回到可用模式并保留当前题', () => {
  const { result } = renderHook(useQuestionContext, { wrapper })
  act(() => result.current.openQuestion(question as Question))
  act(() => {
    result.current.selectCategory('network')
    result.current.selectMode('coding')
  })
  expect(result.current.selectedMode).toBe('coding')
  act(() => result.current.selectTopic('network:dns'))
  expect(result.current.selectedMode).toBe('theory')
  act(() => result.current.selectMode('debug'))
  expect(result.current.selectedMode).toBe('theory')
  expect(result.current.currentQuestion?.id).toBe(question.id)
  act(() => {
    result.current.selectTopic('network:fetch')
    result.current.selectMode('coding')
  })
  expect(result.current.selectedMode).toBe('coding')
  act(() => result.current.selectCategory('governance'))
  expect(result.current.selectedMode).toBe('theory')
})

it('新专项可独立选择并在刷新后恢复，概念考点仍限制题型且不覆盖当前旧题', () => {
  const first = renderHook(useQuestionContext, { wrapper })
  act(() => first.result.current.openQuestion(question as Question))
  act(() => {
    first.result.current.selectCategory('ai-apps')
    first.result.current.selectTopic('ai-apps:structured-output')
    first.result.current.selectMode('coding')
  })
  expect(first.result.current.selectedMode).toBe('coding')
  act(() => first.result.current.selectTopic('ai-apps:prompt-injection'))
  expect(first.result.current.selectedMode).toBe('theory')
  expect(first.result.current.currentQuestion?.id).toBe(question.id)
  first.unmount()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(question)))
  const second = renderHook(useQuestionContext, { wrapper })
  expect(second.result.current.selectedCategoryId).toBe('ai-apps')
  expect(second.result.current.selectedTopicId).toBe('ai-apps:prompt-injection')
})
