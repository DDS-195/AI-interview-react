// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ConfigProvider, theme } from 'antd'
import HistoryView from '../src/components/HistoryView'
import HistoryDetailModal from '../src/components/HistoryDetailModal'
import type { PagedData, HistoryListItem } from '../src/types'
vi.mock('../src/components/CategoryPieChart', () => ({ default: () => null }))
const question = {
  id: 'q1',
  categoryId: 'react',
  title: '测试题',
  content: '完整题目',
  difficulty: 'medium' as const,
  type: 'text' as const
}
const record = {
  questionId: 'q1',
  answer: '完整答案',
  submittedAt: '2026-01-01T00:00:00.000Z',
  score: 0,
  feedback: '完整反馈',
  correctAnswer: '完整参考答案'
}
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({
      matches: false,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    })
  })
  const original = window.getComputedStyle
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => original(element))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it('历史零分详情使用实际暗色 token，切换主题时同步背景与文字', async () => {
  const props = { open: true, record, question, categories: [], onClose: vi.fn() }
  const view = render(
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <HistoryDetailModal {...props} />
    </ConfigProvider>
  )
  expect(screen.getByText('得分 0 分')).toBeTruthy()
  const darkBackground = screen.getByText('完整参考答案').style.background
  expect(darkBackground).not.toBe('rgb(255, 255, 255)')
  const evaluation = screen.getByText('评估反馈').parentElement!.parentElement!
  expect(evaluation.style.color).toContain('255')
  view.rerender(
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <HistoryDetailModal {...props} />
    </ConfigProvider>
  )
  await waitFor(() =>
    expect(screen.getByText('完整参考答案').style.background).not.toBe(darkBackground)
  )
})
it('点击历史时读取完整详情，失败提示后可重试，摘要不代替完整回答', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: '读取失败' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ record, question }) })
  vi.stubGlobal('fetch', fetcher)
  const data: PagedData<HistoryListItem> = {
    items: [{ questionId: 'q1', submittedAt: record.submittedAt, preview: '短摘要', question }],
    page: 1,
    pageSize: 6,
    total: 1,
    distribution: []
  }
  render(
    <HistoryView
      data={data}
      loading={false}
      error=""
      onPageChange={vi.fn()}
      onRetry={vi.fn()}
      categories={[]}
      onDeleteRecord={vi.fn()}
      onClearAll={vi.fn()}
      onBack={vi.fn()}
    />
  )
  expect(screen.getByText('短摘要')).toBeTruthy()
  expect(screen.queryByText('完整答案')).toBeNull()
  fireEvent.click(screen.getByText('查看'))
  expect(await screen.findByText('读取失败')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
  expect(await screen.findByText('完整答案')).toBeTruthy()
  expect(screen.getByText('完整参考答案')).toBeTruthy()
  expect(fetcher.mock.calls[0][0]).toBe(
    '/api/data/history/' + encodeURIComponent(record.submittedAt)
  )
})
