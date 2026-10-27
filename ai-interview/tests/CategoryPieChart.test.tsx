// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const chart = vi.hoisted(() => ({ loaded: vi.fn() }))
vi.mock('../src/components/CategoryPieCanvas', () => {
  chart.loaded()
  return { default: () => <div>图表已经加载</div> }
})
import CategoryPieChart from '../src/components/CategoryPieChart'
afterEach(cleanup)
it('空列表不加载图表模块，有数据后才加载', async () => {
  const { rerender } = render(
    <CategoryPieChart
      data={[]}
      title="分类"
      emptyText="暂无数据"
    />
  )
  expect(screen.getByText('暂无数据')).toBeTruthy()
  expect(chart.loaded).not.toHaveBeenCalled()
  rerender(
    <CategoryPieChart
      data={[{ name: 'React', value: 1 }]}
      title="分类"
      emptyText="暂无数据"
    />
  )
  expect(await screen.findByText('图表已经加载')).toBeTruthy()
  expect(chart.loaded).toHaveBeenCalledTimes(1)
})
