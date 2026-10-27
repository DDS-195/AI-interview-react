// 有分类分布数据时才加载图表，空列表不引入图表渲染开销。
import { lazy, memo, Suspense } from 'react'

const CategoryPieCanvas = lazy(() => import('./CategoryPieCanvas'))
interface CategoryPieChartProps {
  data: { name: string; value: number }[]
  title: string
  emptyText: string
}
export default memo(function CategoryPieChart({ data, title, emptyText }: CategoryPieChartProps) {
  const placeholder = (
    <div className="pie-chart-card">
      <div className="pie-chart-title">{title}</div>
      <div className="pie-chart-empty">{data.length ? '正在加载图表…' : emptyText}</div>
    </div>
  )
  if (!data.length) {
    return placeholder
  }
  return (
    <Suspense fallback={placeholder}>
      <CategoryPieCanvas
        data={data}
        title={title}
        emptyText={emptyText}
      />
    </Suspense>
  )
})
