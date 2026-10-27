// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { QuestionListItem } from '../src/types'
import QuestionLibrary from '../src/components/QuestionLibrary'
const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  mutate: vi.fn(),
  get: vi.fn(),
  open: vi.fn(),
  navigate: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
}))
vi.mock('../src/utils/dataRequest', () => ({ dataRequest: mocks.request }))
vi.mock('../src/contexts/DataContext', () => ({
  useDataContext: () => ({ revision: 0, mutate: mocks.mutate })
}))
vi.mock('../src/contexts/QuestionContext', () => ({
  useQuestionContext: () => ({ getQuestionById: mocks.get, openQuestion: mocks.open })
}))
vi.mock('antd', () => ({
  message: {
    useMessage: () => [
      { success: mocks.success, error: mocks.error },
      <div key="message-holder">通知容器</div>
    ]
  },
  Alert: ({ message, action }: { message: string; action: React.ReactNode }) => (
    <div>
      {message}
      {action}
    </div>
  ),
  Button: ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Empty: ({ description }: { description: string }) => <div>{description}</div>,
  Spin: ({ tip }: { tip: string }) => <div>{tip}</div>,
  Pagination: () => <div>分页</div>
}))
vi.mock('../src/components/SavedQuestionModal', () => ({ default: () => null }))
vi.mock('../src/components/SavedHistoryModal', () => ({ default: () => null }))
vi.mock('../src/components/LibraryFilters', () => ({
  default: ({
    onChange,
    onReset
  }: {
    onChange: (key: string, value: string) => void
    onReset: () => void
  }) => (
    <>
      <button onClick={() => onChange('categoryId', 'vue')}>筛选Vue</button>
      <button onClick={onReset}>重置</button>
    </>
  )
}))
vi.mock('../src/components/QuestionLibraryCard', () => ({
  default: ({
    item,
    onOpen,
    onMark
  }: {
    item: QuestionListItem
    onOpen: () => void
    onMark: (status: string) => void
  }) => (
    <div>
      {item.title}
      <button onClick={onOpen}>练习本题</button>
      <button onClick={() => onMark('pending')}>加入复习</button>
    </div>
  )
}))
function Location() {
  return <div data-testid="location">{useLocation().search}</div>
}
function renderPage(path = '/bank', reviews = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QuestionLibrary
        reviews={reviews}
        onNavigateToQuestion={mocks.navigate}
      />
      <Location />
    </MemoryRouter>
  )
}
const item = { id: 'q1', title: '已保存题目' }
beforeEach(() => {
  vi.clearAllMocks()
  mocks.request.mockResolvedValue({
    items: [item],
    total: 1,
    page: 1,
    pageSize: 8,
    reviewThreshold: 80
  })
  mocks.mutate.mockResolvedValue(undefined)
  mocks.get.mockResolvedValue({ ...item, categoryId: 'react' })
})
afterEach(cleanup)

it('通知容器渲染与数据更新不产生重复标识警告', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    renderPage()
    await screen.findByText('已保存题目')
    expect(
      errors.mock.calls.some((call) => call.some((value) => String(value).includes('same key')))
    ).toBe(false)
  } finally {
    errors.mockRestore()
  }
})

it('题库练习打开已保存题目，再返回练习页，不生成新题', async () => {
  renderPage()
  fireEvent.click(await screen.findByText('练习本题'))
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledOnce())
  expect(mocks.get).toHaveBeenCalledWith('q1', expect.any(AbortSignal))
  expect(mocks.open).toHaveBeenCalledWith({ ...item, categoryId: 'react' })
})
it('分类筛选清除旧知识点及页码，刷新后路由仍能恢复筛选', async () => {
  renderPage('/bank?categoryId=react&topicId=react:hooks&page=3')
  await screen.findByText('已保存题目')
  fireEvent.click(screen.getByText('筛选Vue'))
  await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('?categoryId=vue'))
  await waitFor(() => expect(mocks.request.mock.calls.at(-1)?.[0]).toContain('categoryId=vue'))
})
it('复习标记只在保存成功后提示，失败可重新操作', async () => {
  mocks.mutate.mockRejectedValueOnce(new Error('保存失败'))
  renderPage('/reviews', true)
  fireEvent.click(await screen.findByText('加入复习'))
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('保存失败'))
  expect(mocks.success).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('加入复习'))
  await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('已加入复习'))
  expect(mocks.mutate).toHaveBeenCalledWith('/reviews/q1', 'PUT', { status: 'pending' })
})
it('读取失败显示重试入口，恢复后重新展示题库', async () => {
  mocks.request.mockRejectedValueOnce(new Error('服务暂不可用'))
  renderPage()
  fireEvent.click(await screen.findByText('重试'))
  expect(await screen.findByText('已保存题目')).toBeTruthy()
})
