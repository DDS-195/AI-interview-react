// @vitest-environment jsdom
import type { ReactNode } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DataProvider, useDataContext } from '../src/contexts/DataContext'
import { usePagedData } from '../src/hooks/usePagedData'
import type { HistoryListItem, PagedData } from '../src/types'
vi.mock('../src/utils/legacyData', () => ({
  readLegacyData: () => null,
  markLegacyMigrated: vi.fn()
}))
const initial = {
  counts: { questions: 1, favorites: 1, history: 0 },
  favorites: [{ questionId: 'q1', addedAt: '2026-01-01' }]
}
const response = (data: unknown, ok = true) => ({ ok, json: async () => data })
const wrapper = ({ children }: { children: ReactNode }) => <DataProvider>{children}</DataProvider>
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('只应用变更，保存历史不替换收藏数组，失败后后续保存仍可进行', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(response(initial))
    .mockResolvedValueOnce(response({ counts: { ...initial.counts, history: 1 } }))
    .mockResolvedValueOnce(response({ error: '保存失败' }, false))
    .mockResolvedValueOnce(
      response({ counts: { ...initial.counts, favorites: 0, history: 1 }, removedFavoriteId: 'q1' })
    )
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(useDataContext, { wrapper })
  await waitFor(() => expect(result.current?.data).toEqual(initial))
  const favorites = result.current.data.favorites
  await act(async () => result.current.mutate('/history', 'POST', {}))
  expect(result.current.data.favorites).toBe(favorites)
  expect(result.current.revision).toBe(1)
  await act(async () => {
    await expect(result.current.mutate('/history', 'POST', {})).rejects.toThrow('保存失败')
  })
  await act(async () => result.current.mutate('/favorites/q1', 'DELETE'))
  expect(result.current.data.favorites).toEqual([])
  expect(result.current.data.counts.history).toBe(1)
  expect(result.current.revision).toBe(2)
})

it('快速翻页时取消旧请求，迟到的列表不覆盖新页，服务器收敛页码会显示正确页', async () => {
  const pending: Array<(value: ReturnType<typeof response>) => void> = []
  const fetcher = vi
    .fn()
    .mockImplementation((url: string) =>
      url === '/api/data'
        ? Promise.resolve(response(initial))
        : new Promise((resolve) => pending.push(resolve))
    )
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(() => usePagedData<HistoryListItem>('history'), { wrapper })
  await waitFor(() => expect(pending).toHaveLength(1))
  act(() => result.current.onPageChange(2))
  await waitFor(() => expect(pending).toHaveLength(2))
  const page = (number: number): PagedData<HistoryListItem> => ({
    items: [],
    total: 6,
    page: number,
    pageSize: 6,
    distribution: []
  })
  await act(async () => {
    pending[1](response(page(1)))
  })
  expect(result.current.data.page).toBe(1)
  expect(result.current.loading).toBe(false)
  expect(fetcher.mock.calls[1][1].signal.aborted).toBe(true)
  await act(async () => {
    pending[0](response(page(99)))
  })
  expect(result.current.data.page).toBe(1)
})
