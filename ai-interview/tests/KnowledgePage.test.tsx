// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import KnowledgePage from '../src/pages/KnowledgePage'
const mocks = vi.hoisted(() => ({
  data: {
    documents: [] as unknown[],
    status: { ready: true, mode: 'prefer', documents: 23, indexed: 23, pending: 0 }
  }
}))
vi.mock('../src/hooks/useKnowledge', () => ({
  useKnowledge: () => ({ data: mocks.data, loading: false, error: '', refresh: vi.fn() })
}))
vi.mock('../src/utils/knowledgeRequest', () => ({ knowledgeRequest: vi.fn() }))
vi.mock('../src/components/KnowledgeEvidence', () => ({ default: () => null }))
vi.mock('antd', () => ({
  Alert: () => null,
  Tag: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Space: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Input: ({ allowClear: _clear, onPressEnter: _enter, ...props }: Record<string, unknown>) => (
    <input {...props} />
  ),
  Select: ({
    options,
    onChange,
    ...props
  }: {
    options: { value: string; label: string }[]
    onChange: (value: string) => void
  }) => (
    <select
      {...props}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((item) => (
        <option
          key={item.value}
          value={item.value}
        >
          {item.label}
        </option>
      ))}
    </select>
  ),
  Empty: Object.assign(({ description }: { description: string }) => <div>{description}</div>, {
    PRESENTED_IMAGE_SIMPLE: 'empty'
  }),
  Modal: () => null,
  Spin: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Typography: { Paragraph: ({ children }: { children: ReactNode }) => <p>{children}</p> },
  Pagination: ({ current, onChange }: { current: number; onChange: (page: number) => void }) => (
    <>
      <span>当前页 {current}</span>
      <button onClick={() => onChange(current + 1)}>下一页</button>
    </>
  )
}))
beforeEach(() => {
  mocks.data.documents = Array.from({ length: 23 }, (_, index) => ({
    id: String(index),
    title: `资料-${index}`,
    categoryId: index < 21 ? 'react' : 'vue',
    technicalVersion: '测试版本'
  }))
})
afterEach(cleanup)
it('资料分页后切换分类回到第一页，标题筛选提供空状态', () => {
  render(<KnowledgePage />)
  expect(screen.getAllByText('查看资料')).toHaveLength(10)
  expect(screen.queryByText('资料-10')).toBeNull()
  fireEvent.click(screen.getByText('下一页'))
  expect(screen.getByText('资料-10')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('资料分类'), { target: { value: 'vue' } })
  expect(screen.getByText('资料-21')).toBeTruthy()
  expect(screen.getAllByText('查看资料')).toHaveLength(2)
  fireEvent.change(screen.getByLabelText('搜索资料标题'), { target: { value: '不存在' } })
  expect(screen.getByText('没有符合条件的资料')).toBeTruthy()
  expect(screen.queryByText('查看资料')).toBeNull()
})
it('刷新后资料数量减少时，当前页被限制到有效范围', () => {
  const view = render(<KnowledgePage />)
  fireEvent.click(screen.getByText('下一页'))
  fireEvent.click(screen.getByText('下一页'))
  expect(screen.getByText('当前页 3')).toBeTruthy()
  mocks.data.documents = mocks.data.documents.slice(0, 11)
  view.rerender(<KnowledgePage />)
  expect(screen.getByText('当前页 2')).toBeTruthy()
  expect(screen.getByText('资料-10')).toBeTruthy()
})
