// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useDataResource } from '../src/hooks/useDataResource'
const mocks = vi.hoisted(() => ({ revision: 0, request: vi.fn() }))
vi.mock('../src/contexts/DataContext', () => ({
  useDataContext: () => ({ revision: mocks.revision })
}))
vi.mock('../src/utils/dataRequest', () => ({ dataRequest: mocks.request }))
beforeEach(() => {
  mocks.revision = 0
  mocks.request.mockReset()
})
afterEach(cleanup)

it('切换筛选取消旧请求，忽略晚到的结果与错误', async () => {
  let resolveOld!: (value: { label: string }) => void
  let resolveNew!: (value: { label: string }) => void
  mocks.request
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve
      })
    )
    .mockReturnValueOnce(
      new Promise((resolve) => {
        resolveNew = resolve
      })
    )
  const hook = renderHook(({ path }) => useDataResource<{ label: string }>(path), {
    initialProps: { path: '/questions?categoryId=react' }
  })
  const oldSignal = mocks.request.mock.calls[0][3] as AbortSignal
  hook.rerender({ path: '/questions?categoryId=vue' })
  expect(oldSignal.aborted).toBe(true)
  await act(async () => resolveNew({ label: 'Vue' }))
  expect(hook.result.current.data?.label).toBe('Vue')
  await act(async () => resolveOld({ label: 'React' }))
  expect(hook.result.current.data?.label).toBe('Vue')
})
it('数据库临时失败后可重试，数据版本变化重新读取', async () => {
  mocks.request.mockRejectedValueOnce(new Error('MySQL暂不可用')).mockResolvedValue({ total: 0 })
  const hook = renderHook(() => useDataResource<{ total: number }>('/reviews'))
  await waitFor(() => expect(hook.result.current.error).toBe('MySQL暂不可用'))
  act(() => hook.result.current.retry())
  await waitFor(() => expect(hook.result.current.data?.total).toBe(0))
  expect(hook.result.current.error).toBe('')
  mocks.revision++
  hook.rerender()
  await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(3))
})
it('关闭详情后取消请求，隐藏的弹窗不读取数据', async () => {
  mocks.request.mockReturnValue(new Promise(() => {}))
  const hook = renderHook(({ path }: { path: string | null }) => useDataResource(path), {
    initialProps: { path: '/questions/q1' as string | null }
  })
  const signal = mocks.request.mock.calls[0][3] as AbortSignal
  hook.rerender({ path: null })
  expect(signal.aborted).toBe(true)
  expect(mocks.request).toHaveBeenCalledOnce()
  expect(hook.result.current.loading).toBe(false)
})
