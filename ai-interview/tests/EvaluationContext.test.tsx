// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const api = vi.hoisted(() => ({ evaluate: vi.fn() }))
vi.mock('../src/utils/aiRequest', () => ({ evaluateAIAnswer: api.evaluate }))
import { EvaluationProvider, useEvaluationContext } from '../src/contexts/EvaluationContext'
const wrapper = ({ children }: { children: ReactNode }) => (
  <EvaluationProvider>{children}</EvaluationProvider>
)
afterEach(() => {
  cleanup()
  localStorage.clear()
  api.evaluate.mockReset()
})

it('评估失败后恢复可提交状态，不打开成功弹窗', async () => {
  api.evaluate.mockRejectedValue(new Error('模型不可用'))
  const { result } = renderHook(useEvaluationContext, { wrapper })
  await act(async () => {
    await expect(result.current.evaluateAnswerWithAI('题目', '答案')).rejects.toThrow('模型不可用')
  })
  expect(result.current.isEvaluatingAnswer).toBe(false)
  expect(result.current.showEvaluation).toBe(false)
  expect(result.current.aiEvaluationResult).toBeNull()
})
it('真实 0 分能进入成功弹窗，不被当作无结果', async () => {
  api.evaluate.mockResolvedValue({ score: 0, feedback: '回答错误' })
  const { result } = renderHook(useEvaluationContext, { wrapper })
  await act(async () => {
    await result.current.evaluateAnswerWithAI('题目', '答案')
  })
  expect(result.current.aiEvaluationResult?.score).toBe(0)
  expect(result.current.showEvaluation).toBe(true)
})

it('切题重置后旧评估仍返回供保存历史，但不再打开当前题弹窗', async () => {
  let resolve!: (value: { score: number; feedback: string }) => void
  api.evaluate.mockReturnValue(
    new Promise((done) => {
      resolve = done
    })
  )
  const { result } = renderHook(useEvaluationContext, { wrapper })
  let pending!: ReturnType<typeof result.current.evaluateAnswerWithAI>
  act(() => {
    pending = result.current.evaluateAnswerWithAI('旧题', '旧答案')
  })
  act(() => result.current.resetEvaluation())
  await act(async () => {
    resolve({ score: 88, feedback: '旧题反馈' })
    await pending
  })
  expect(await pending).toEqual({ score: 88, feedback: '旧题反馈' })
  expect(result.current.showEvaluation).toBe(false)
  expect(result.current.aiEvaluationResult).toBeNull()
})

it('新题可以提交，旧请求完成不能覆盖新题结果或结束新题加载', async () => {
  const pending: Array<(value: { score: number; feedback: string }) => void> = []
  api.evaluate.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))
  const { result } = renderHook(useEvaluationContext, { wrapper })
  let oldRequest!: ReturnType<typeof result.current.evaluateAnswerWithAI>
  let newRequest!: ReturnType<typeof result.current.evaluateAnswerWithAI>
  act(() => {
    oldRequest = result.current.evaluateAnswerWithAI('旧题', '旧答案')
  })
  act(() => result.current.resetEvaluation())
  act(() => {
    newRequest = result.current.evaluateAnswerWithAI('新题', '新答案')
  })
  expect(api.evaluate).toHaveBeenCalledTimes(2)
  await act(async () => {
    pending[0]({ score: 88, feedback: '旧结果' })
    await oldRequest
  })
  expect(result.current.isEvaluatingAnswer).toBe(true)
  expect(result.current.aiEvaluationResult).toBeNull()
  await act(async () => {
    pending[1]({ score: 96, feedback: '新结果' })
    await newRequest
  })
  expect(result.current.aiEvaluationResult?.score).toBe(96)
  expect(result.current.isEvaluatingAnswer).toBe(false)
})

it('网络失败后刷新再提交相同回答，沿用提交标识避免重复记录', async () => {
  api.evaluate
    .mockRejectedValueOnce(new Error('网络中断'))
    .mockResolvedValueOnce({ score: 0, feedback: '已保存' })
  const first = renderHook(useEvaluationContext, { wrapper })
  await act(async () => {
    await expect(first.result.current.evaluateAnswerWithAI('q1', '回答')).rejects.toThrow(
      '网络中断'
    )
  })
  const submittedAt = api.evaluate.mock.calls[0][2]
  first.unmount()
  const second = renderHook(useEvaluationContext, { wrapper })
  await act(async () => {
    await second.result.current.evaluateAnswerWithAI('q1', '回答')
  })
  expect(api.evaluate.mock.calls[1][2]).toBe(submittedAt)
  expect(localStorage.getItem('ai_submission_q1')).toBeNull()
})
