// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const calls = vi.hoisted(() => ({ generate: vi.fn() }))
vi.mock('../src/utils/aiRequest', () => ({ generateAIQuestionStream: calls.generate }))
import { useQuestionStream } from '../src/hooks/useQuestionStream'
import type { QuestionMode } from '../src/types'
beforeEach(() => {
  calls.generate.mockReset()
  calls.generate.mockImplementation(() => new AbortController())
})
afterEach(cleanup)
const options = () => ({ categoryId: 'react', existingTitles: [], onQuestionGenerated: vi.fn() })

it('同步重复点击也只发起一次生成', () => {
  const { result } = renderHook(() => useQuestionStream(options()))
  act(() => {
    result.current.startStreaming()
    result.current.startStreaming()
  })
  expect(calls.generate).toHaveBeenCalledOnce()
  expect(result.current.isStreaming).toBe(true)
})
it('流失败退出生成状态并允许重新生成', () => {
  const { result } = renderHook(() => useQuestionStream(options()))
  act(() => result.current.startStreaming())
  act(() => calls.generate.mock.calls[0][4]('题目生成中断'))
  expect(result.current.isStreaming).toBe(false)
  expect(result.current.error).toBe('题目生成中断')
  act(() => result.current.startStreaming())
  expect(result.current.error).toBeNull()
  expect(calls.generate).toHaveBeenCalledTimes(2)
})
it('切换分类或取消后忽略旧请求的迟到内容和错误', () => {
  const config = options()
  const { result } = renderHook(() => useQuestionStream(config))
  act(() => result.current.startStreaming())
  const previous = calls.generate.mock.calls[0]
  act(() => {
    result.current.abortStream()
    result.current.startStreaming()
  })
  act(() => {
    previous[2]('旧题')
    previous[3]('旧标题', '旧内容', 'medium', '')
    previous[4]('旧错误')
  })
  expect(config.onQuestionGenerated).not.toHaveBeenCalled()
  expect(result.current.error).toBeNull()
  expect(result.current.isStreaming).toBe(true)
})
it('保留服务端题目ID、考点、评分要点和版本，供后续评分与保存', () => {
  const config = options()
  const { result } = renderHook(() => useQuestionStream(config))
  const question = {
    id: 'server-id',
    categoryId: 'react',
    title: '标题',
    content: '明确题干',
    difficulty: 'medium',
    type: 'text',
    topic: 'useEffect',
    promptVersion: 'question-v2.0',
    rubric: [{ id: 'p1', description: '要求', weight: 100, expected: '参考' }],
    referenceAnswer: '参考',
    optionalPoints: []
  }
  act(() => result.current.startStreaming())
  act(() =>
    calls.generate.mock.calls[0][3](
      question.title,
      question.content,
      question.difficulty,
      question.topic,
      question
    )
  )
  expect(config.onQuestionGenerated).toHaveBeenCalledWith(question)
  expect(result.current.isStreaming).toBe(false)
})
it('结构化预览保留正文空行与合法JSON示例，不把标题重复放进正文', () => {
  vi.useFakeTimers()
  try {
    const { result } = renderHook(() => useQuestionStream(options()))
    act(() => result.current.startStreaming())
    const body = '第一段\n\n{"difficulty":"medium"}'
    act(() => calls.generate.mock.calls[0][2]('标题\n' + body))
    act(() => vi.runAllTimers())
    expect(result.current.streamingTitle).toBe('标题')
    expect(result.current.streamingContent).toBe(body)
  } finally {
    vi.useRealTimers()
  }
})

it('领域、模式、知识点和难度传到后端，模式变化后的旧流结果被忽略', () => {
  const config = {
    ...options(),
    mode: 'coding' as QuestionMode,
    topicId: 'react:effects',
    difficulty: 'hard' as const
  }
  const { result, rerender } = renderHook(() => useQuestionStream(config))
  act(() => result.current.startStreaming())
  const previous = calls.generate.mock.calls[0]
  expect(previous[5]).toEqual({ mode: 'coding', topicId: 'react:effects', difficulty: 'hard' })
  config.mode = 'theory'
  rerender()
  act(() => {
    previous[2]('迟到内容')
    previous[3]('旧题', '旧内容', 'hard', '旧考点')
    previous[4]('旧错误')
  })
  expect(config.onQuestionGenerated).not.toHaveBeenCalled()
  expect(result.current.error).toBeNull()
})

it('切换后立即取消旧分类请求，只有新分类结果可更新题目', () => {
  const config = options()
  const { result, rerender } = renderHook(() => useQuestionStream(config))
  act(() => result.current.startStreaming())
  const previous = calls.generate.mock.calls[0]
  const oldController = calls.generate.mock.results[0].value as AbortController
  config.categoryId = 'vue'
  rerender()
  act(() => {
    result.current.abortStream()
    result.current.startStreaming()
  })
  expect(oldController.signal.aborted).toBe(true)
  expect(calls.generate.mock.calls[1][0]).toBe('vue')
  act(() => {
    previous[2]('旧题')
    previous[3]('旧标题', '旧内容', 'easy', '')
    previous[4]('旧错误')
  })
  expect(config.onQuestionGenerated).not.toHaveBeenCalled()
  const next = {
    id: 'new-vue',
    categoryId: 'vue',
    title: '新题',
    content: '新内容',
    difficulty: 'easy',
    type: 'text'
  }
  act(() => calls.generate.mock.calls[1][3](next.title, next.content, next.difficulty, '', next))
  expect(config.onQuestionGenerated).toHaveBeenCalledExactlyOnceWith(next)
  expect(result.current.error).toBeNull()
  expect(result.current.isStreaming).toBe(false)
})
