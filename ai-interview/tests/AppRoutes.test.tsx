// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AppRoutes from '../src/components/AppRoutes'
import ErrorBoundary from '../src/components/ErrorBoundary'
vi.mock('../src/pages/QuestionPage', () => ({ default: () => <div>题目页面</div> }))
vi.mock('../src/pages/HistoryPage', () => ({ default: () => <div>历史页面</div> }))
vi.mock('../src/pages/FavoritesPage', () => ({ default: () => <div>收藏页面</div> }))
vi.mock('../src/pages/QuestionBankPage', () => ({ default: () => <div>题库页面</div> }))
vi.mock('../src/pages/ReviewPage', () => ({ default: () => <div>复习页面</div> }))
vi.mock('../src/pages/LearningOverviewPage', () => ({ default: () => <div>概览页面</div> }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it.each([
  ['/', '题目页面'],
  ['/history', '历史页面'],
  ['/favorites', '收藏页面'],
  ['/bank', '题库页面'],
  ['/reviews', '复习页面'],
  ['/overview', '概览页面'],
  ['/missing', '题目页面']
])('路由 %s 显示正确页面，未知路径自动回首页', async (path, text) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes onNavigateToQuestion={vi.fn()} />
    </MemoryRouter>
  )
  expect(await screen.findByText(text)).toBeTruthy()
})
it('组件加载出错显示恢复入口，避免整页白屏', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const expectedError = (event: ErrorEvent) => {
    if (event.message.includes('chunk load failed')) {
      event.preventDefault()
    }
  }
  window.addEventListener('error', expectedError)
  function Broken(): never {
    throw new Error('chunk load failed')
  }
  try {
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>
    )
    expect(screen.getByText('页面加载失败')).toBeTruthy()
    expect(screen.getByRole('button', { name: /重新加载/ })).toBeTruthy()
  } finally {
    window.removeEventListener('error', expectedError)
  }
})
