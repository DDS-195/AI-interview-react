// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  getQuestion: vi.fn(),
  openQuestion: vi.fn(),
  navigate: vi.fn(),
  error: vi.fn()
}))
vi.mock('antd', () => ({ message: { useMessage: () => [{ error: mocks.error }, null] } }))
vi.mock('../src/contexts/QuestionContext', () => ({
  CATEGORIES: [],
  useQuestionContext: () => ({
    getQuestionById: mocks.getQuestion,
    openQuestion: mocks.openQuestion
  })
}))
vi.mock('../src/contexts/FavoriteContext', () => ({
  useFavoriteContext: () => ({ removeFavorite: vi.fn(), clearAll: vi.fn() })
}))
vi.mock('../src/hooks/usePagedData', () => ({ usePagedData: () => ({}) }))
vi.mock('../src/components/FavoritesView', () => ({
  default: ({
    onLoadFavorite,
    loadingId
  }: {
    onLoadFavorite: (fav: { questionId: string; addedAt: string }) => void
    loadingId: string
  }) => (
    <button
      disabled={!!loadingId}
      onClick={() => onLoadFavorite({ questionId: 'q1', addedAt: '' })}
    >
      查看收藏
    </button>
  )
}))
import FavoritesPage from '../src/pages/FavoritesPage'
beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)
it('按需加载收藏原题后导航，不再次写入后端', async () => {
  const question = {
    id: 'q1',
    categoryId: 'react',
    title: 'React',
    content: '完整题目',
    difficulty: 'medium',
    type: 'text'
  }
  mocks.getQuestion.mockResolvedValue(question)
  render(<FavoritesPage onNavigateToQuestion={mocks.navigate} />)
  fireEvent.click(screen.getByText('查看收藏'))
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1))
  expect(mocks.openQuestion).toHaveBeenCalledWith(question)
})
it('加载失败显示提示并恢复按钮，不导航至空题目', async () => {
  mocks.getQuestion.mockRejectedValue(new Error('题目已删除'))
  render(<FavoritesPage onNavigateToQuestion={mocks.navigate} />)
  fireEvent.click(screen.getByText('查看收藏'))
  await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('题目已删除'))
  expect(mocks.navigate).not.toHaveBeenCalled()
  expect((screen.getByText('查看收藏') as HTMLButtonElement).disabled).toBe(false)
})
it('离开收藏页后取消加载，迟到结果不再改变分类或导航', async () => {
  let resolve!: (value: unknown) => void
  mocks.getQuestion.mockReturnValue(
    new Promise((done) => {
      resolve = done
    })
  )
  const view = render(<FavoritesPage onNavigateToQuestion={mocks.navigate} />)
  fireEvent.click(screen.getByText('查看收藏'))
  const signal = mocks.getQuestion.mock.calls[0][1] as AbortSignal
  view.unmount()
  expect(signal.aborted).toBe(true)
  resolve({ id: 'q1', categoryId: 'react' })
  await Promise.resolve()
  expect(mocks.openQuestion).not.toHaveBeenCalled()
  expect(mocks.navigate).not.toHaveBeenCalled()
})
