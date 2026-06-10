import { memo, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

interface PieDataItem {
  name: string
  value: number
}

interface CategoryPieChartProps {
  data: PieDataItem[]
  title: string
  emptyText: string
}

const COLORS = [
  '#5b5ef7', '#8183f8', '#a78bfa', '#38bdf8',
  '#34d399', '#f59e0b', '#ef4444', '#ec4899',
  '#8b5cf6', '#10b981', '#f97316', '#06b6d4',
  '#6366f1', '#14b8a6', '#e11d48',
]

export default memo(function CategoryPieChart({ data, title, emptyText }: CategoryPieChartProps) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} 题 ({d}%)',
      appendToBody: true,
    },
    legend: { show: false },
    series: [{
      type: 'pie' as const,
      radius: ['55%', '85%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: false },
        labelLine: { show: false },
        scaleSize: 8,
      },
      data: data.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } })),
    }],
  }), [data])

  if (data.length === 0) {
    return (
      <div className="pie-chart-card">
        <div className="pie-chart-title">{title}</div>
        <div className="pie-chart-empty">{emptyText}</div>
      </div>
    )
  }

  return (
    <div className="pie-chart-card">
      <div className="pie-chart-title">{title}</div>
      <ReactECharts
        option={option}
        style={{ height: 240 }}
        className="pie-chart-canvas"
        opts={{ renderer: 'svg' }}
      />
      <div className="pie-chart-stats">
        <div className="pie-chart-stat-group">
          <div className="pie-chart-stat-item">
            <span className="pie-chart-stat-label">涉及分类</span>
            <span className="pie-chart-stat-num">{data.length}</span>
          </div>
          <div className="pie-chart-stat-item">
            <span className="pie-chart-stat-label">题目总数</span>
            <span className="pie-chart-stat-num">{total}</span>
          </div>
        </div>
        <div className="pie-chart-stat-minilist">
          {data.map(d => (
            <div key={d.name} className="pie-chart-stat-row">
              <span className="pie-chart-stat-dot" style={{ background: COLORS[data.indexOf(d) % COLORS.length] }} />
              <span className="pie-chart-stat-name">{d.name}</span>
              <span className="pie-chart-stat-val">{d.value}题</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
