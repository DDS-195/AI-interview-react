// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { Question } from '../src/types'
import { StrictMode } from 'react'

const mocks = vi.hoisted(() => ({
  state: {
    question: {
      id: 'q1',
      categoryId: 'react',
      title: '题目',
      content: '内容',
      difficulty: 'medium',
      type: 'text'
    } as Question,
    category: 'react',
    topic: '',
    mode: 'theory',
    difficulty: '',
    restoring: false,
    request: null as { id: number; categoryId: string } | null
  },
  consume: vi.fn(),
  reset: vi.fn(),
  start: vi.fn(),
  abort: vi.fn(),
  history: vi.fn(),
  evaluate: vi.fn(),
  error: vi.fn(),
  refresh: vi.fn().mockResolvedValue(undefined)
}))
vi.mock('../src/contexts/QuestionContext', () => ({
  useQuestionContext: () => ({
    selectedCategoryId: mocks.state.category,
    selectedTopicId: mocks.state.topic,
    selectedMode: mocks.state.mode,
    selectedDifficulty: mocks.state.difficulty,
    isRestoring: mocks.state.restoring,
    categoryGenerationRequest: mocks.state.request,
    consumeCategoryGenerationRequest: mocks.consume,
    currentQuestion: mocks.state.question,
    currentQuestionIndex: 0,
    currentQuestions: [mocks.state.question],
    isCodingCategory: false,
    addQuestion: vi.fn(),
    nextQuestion: vi.fn(),
    prevQuestion: vi.fn(),
    refreshQuestion: vi.fn(),
    getExistingTitles: () => []
  })
}))
vi.mock('../src/contexts/FavoriteContext', () => ({
  useFavoriteContext: () => ({ toggleFavorite: vi.fn(), isFavorite: () => false })
}))
vi.mock('../src/contexts/HistoryContext', () => ({
  useHistoryContext: () => ({ addHistoryRecord: mocks.history })
}))
vi.mock('../src/contexts/DataContext', () => ({
  useDataContext: () => ({ refresh: mocks.refresh })
}))
vi.mock('../src/contexts/EvaluationContext', () => ({
  useEvaluationContext: () => ({
    isEvaluatingAnswer: false,
    aiEvaluationResult: null,
    showEvaluation: false,
    evaluateAnswerWithAI: mocks.evaluate,
    closeEvaluation: vi.fn(),
    resetEvaluation: mocks.reset
  })
}))
vi.mock('../src/hooks/useQuestionStream', () => ({
  useQuestionStream: () => ({
    isStreaming: false,
    streamingContent: '',
    streamingTitle: '',
    hasStarted: false,
    startStreaming: mocks.start,
    abortStream: mocks.abort
  })
}))
vi.mock('antd', () => ({
  message: { useMessage: () => [{ error: mocks.error }, null] },
  Spin: () => <div>恢复中</div>
}))
vi.mock('../src/components/QuestionView', () => ({ default: () => <div>题目</div> }))
vi.mock('../src/components/EvaluationResult', () => ({ default: () => null }))
vi.mock('../src/components/AnswerArea', () => ({
  default: (props: {
    answerText: string
    onAnswerChange: (value: string) => void
    onSubmitAnswer: () => void
    onClearAnswer: () => void
  }) => (
    <>
      <textarea
        aria-label="答案"
        value={props.answerText}
        onChange={(event) => props.onAnswerChange(event.target.value)}
      />
      <button onClick={props.onSubmitAnswer}>提交</button>
      <button onClick={props.onClearAnswer}>清空</button>
    </>
  )
}))
import QuestionPage from '../src/pages/QuestionPage'
vi.mock('../src/components/QuestionFilters', () => ({ default: () => <div>出题范围</div> }))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mocks.state.question = { ...mocks.state.question, id: 'q1' }
  Object.assign(mocks.state, {
    category: 'react',
    topic: '',
    mode: 'theory',
    difficulty: '',
    restoring: false,
    request: null
  })
  mocks.consume.mockImplementation((id: number) => {
    if (mocks.state.request?.id === id) {
      mocks.state.request = null
    }
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('切换历史页再返回时恢复同一题草稿', () => {
  localStorage.setItem('ai_draft_q1', '尚未提交的草稿')
  const first = render(<QuestionPage />)
  expect((screen.getByLabelText('答案') as HTMLTextAreaElement).value).toBe('尚未提交的草稿')
  first.unmount()
  render(<QuestionPage />)
  expect((screen.getByLabelText('答案') as HTMLTextAreaElement).value).toBe('尚未提交的草稿')
})
it('输入后立即离开页面也保存草稿，不丢失防抖期间内容', () => {
  const view = render(<QuestionPage />)
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: '刚输入就离开' } })
  view.unmount()
  expect(localStorage.getItem('ai_draft_q1')).toBe('刚输入就离开')
})
it('切题时分别保存和恢复，旧答案不能覆盖新题草稿', () => {
  vi.useFakeTimers()
  const view = render(<QuestionPage />)
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: '题目一的草稿' } })
  localStorage.setItem('ai_draft_q2', '题目二已有的草稿')
  mocks.state.question = { ...mocks.state.question, id: 'q2' }
  view.rerender(<QuestionPage />)
  expect((screen.getByLabelText('答案') as HTMLTextAreaElement).value).toBe('题目二已有的草稿')
  act(() => vi.advanceTimersByTime(600))
  expect(localStorage.getItem('ai_draft_q1')).toBe('题目一的草稿')
  expect(localStorage.getItem('ai_draft_q2')).toBe('题目二已有的草稿')
})
it('清空只删除当前题草稿', () => {
  localStorage.setItem('ai_draft_q1', '第一题')
  localStorage.setItem('ai_draft_q2', '第二题')
  const view = render(<QuestionPage />)
  fireEvent.click(screen.getByText('清空'))
  view.unmount()
  expect(localStorage.getItem('ai_draft_q1')).toBeNull()
  expect(localStorage.getItem('ai_draft_q2')).toBe('第二题')
})
it('刷新或关闭页面前保存尚未到防抖时间的草稿', () => {
  render(<QuestionPage />)
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: '刷新前刚输入' } })
  fireEvent(window, new Event('pagehide'))
  expect(localStorage.getItem('ai_draft_q1')).toBe('刷新前刚输入')
})

it('提交题目ID，确认后端保存后刷新历史，不再次写入评分', async () => {
  const evaluation = {
    score: 0,
    feedback: '必要项未满足',
    suggestions: ['补充实现'],
    criteria: [
      {
        id: 'p1',
        description: '实现',
        maxPoints: 100,
        points: 0,
        verdict: 'missed',
        evidence: '',
        explanation: '没有实现'
      }
    ],
    promptVersion: 'evaluation-v2.0',
    model: 'fixture-model'
  }
  mocks.evaluate.mockResolvedValue(evaluation)
  render(<QuestionPage />)
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: '回答内容' } })
  await act(async () => fireEvent.click(screen.getByText('提交')))
  expect(mocks.evaluate).toHaveBeenCalledWith('q1', '回答内容')
  expect(mocks.history).not.toHaveBeenCalled()
  expect(mocks.refresh).toHaveBeenCalledOnce()
})
it('评估失败保留回答草稿，不额外创建重复的未评分历史', async () => {
  mocks.evaluate.mockRejectedValueOnce(new Error('网络中断'))
  const view = render(<QuestionPage />)
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: '完整草稿' } })
  await act(async () => fireEvent.click(screen.getByText('提交')))
  expect(mocks.history).not.toHaveBeenCalled()
  expect((screen.getByLabelText('答案') as HTMLTextAreaElement).value).toBe('完整草稿')
  view.unmount()
  expect(localStorage.getItem('ai_draft_q1')).toBe('完整草稿')
})

it('打开已有题目不自动出题或消耗AI请求', async () => {
  render(<QuestionPage />)
  await act(async () => {})
  expect(mocks.start).not.toHaveBeenCalled()
})

it('换分类后只自动生成一次，并等待最新筛选生效', () => {
  vi.useFakeTimers()
  const view = render(<QuestionPage />)
  mocks.state.category = 'vue'
  mocks.state.request = { id: 1, categoryId: 'vue' }
  view.rerender(<QuestionPage />)
  expect(mocks.start).not.toHaveBeenCalled()
  act(() => vi.advanceTimersByTime(300))
  expect(mocks.start).toHaveBeenCalledOnce()
  expect(mocks.consume).toHaveBeenCalledWith(1)
  view.rerender(<QuestionPage />)
  act(() => vi.advanceTimersByTime(1000))
  expect(mocks.start).toHaveBeenCalledOnce()
})

it('快速连续切换合并为最后分类的一次出题', () => {
  vi.useFakeTimers()
  const view = render(<QuestionPage />)
  mocks.state.category = 'vue'
  mocks.state.request = { id: 1, categoryId: 'vue' }
  view.rerender(<QuestionPage />)
  act(() => vi.advanceTimersByTime(100))
  mocks.state.category = 'network'
  mocks.state.request = { id: 2, categoryId: 'network' }
  view.rerender(<QuestionPage />)
  act(() => vi.advanceTimersByTime(300))
  expect(mocks.start).toHaveBeenCalledOnce()
  expect(mocks.consume).toHaveBeenCalledExactlyOnceWith(2)
})

it('知识点、题型、难度变化不会单独自动出题或清空草稿', () => {
  vi.useFakeTimers()
  const view = render(<QuestionPage />)
  fireEvent.change(screen.getByLabelText('答案'), { target: { value: '当前草稿' } })
  Object.assign(mocks.state, { topic: 'react:effects', mode: 'coding', difficulty: 'hard' })
  view.rerender(<QuestionPage />)
  act(() => vi.advanceTimersByTime(1000))
  expect(mocks.start).not.toHaveBeenCalled()
  expect((screen.getByLabelText('答案') as HTMLTextAreaElement).value).toBe('当前草稿')
})

it('从其他页面选择分类后，题目页接收待生成请求', () => {
  vi.useFakeTimers()
  mocks.state.category = 'security'
  mocks.state.request = { id: 3, categoryId: 'security' }
  render(<QuestionPage />)
  act(() => vi.advanceTimersByTime(300))
  expect(mocks.start).toHaveBeenCalledOnce()
  expect(mocks.consume).toHaveBeenCalledWith(3)
})

it('严格模式重复执行效果不会重复自动生成', () => {
  vi.useFakeTimers()
  mocks.state.category = 'vue'
  mocks.state.request = { id: 1, categoryId: 'vue' }
  render(
    <StrictMode>
      <QuestionPage />
    </StrictMode>
  )
  act(() => vi.advanceTimersByTime(300))
  expect(mocks.start).toHaveBeenCalledOnce()
})

it('恢复原题完成后再执行分类切换的生成请求', () => {
  vi.useFakeTimers()
  mocks.state.restoring = true
  mocks.state.category = 'vue'
  mocks.state.request = { id: 1, categoryId: 'vue' }
  const view = render(<QuestionPage />)
  act(() => vi.advanceTimersByTime(1000))
  expect(mocks.start).not.toHaveBeenCalled()
  mocks.state.restoring = false
  view.rerender(<QuestionPage />)
  act(() => vi.advanceTimersByTime(300))
  expect(mocks.start).toHaveBeenCalledOnce()
})

it('离开题目页面时取消尚未启动的自动请求', () => {
  vi.useFakeTimers()
  mocks.state.request = { id: 1, categoryId: 'react' }
  const view = render(<QuestionPage />)
  view.unmount()
  act(() => vi.advanceTimersByTime(1000))
  expect(mocks.start).not.toHaveBeenCalled()
})
