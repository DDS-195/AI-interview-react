// 趋势图使用接口返回的统计口径，不在展示层重新计算能力分数。
import type { LearningOverview } from '../types'
import { Empty } from 'antd'

export default function ScoreTrend({ trend }: { trend: LearningOverview['trend'] }) {
  const scored = trend
    .map((entry, index) => ({ ...entry, index }))
    .filter((entry) => entry.averageScore !== null)
  if (!scored.length) {
    return (
      <Empty
        description="完成评分后显示成绩趋势"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }
  const x = (index: number) => (trend.length > 1 ? 48 + (index * 544) / (trend.length - 1) : 320)
  const y = (score: number) => 172 - score * 1.4
  const labels = [...new Set([0, Math.floor((trend.length - 1) / 2), trend.length - 1])]
  return (
    <svg
      className="score-trend"
      viewBox="0 0 640 214"
      role="img"
      aria-label="最近十四个作答日的平均成绩趋势"
    >
      {[0, 50, 80, 100].map((score) => (
        <g key={score}>
          <line
            x1="48"
            x2="592"
            y1={y(score)}
            y2={y(score)}
            className="trend-grid"
          />
          <text
            x="36"
            y={y(score) + 4}
            textAnchor="end"
          >
            {score}
          </text>
        </g>
      ))}
      <polyline
        points={scored.map((entry) => `${x(entry.index)},${y(entry.averageScore!)}`).join(' ')}
        className="trend-line"
      />
      {scored.map((entry) => (
        <circle
          key={entry.date}
          cx={x(entry.index)}
          cy={y(entry.averageScore!)}
          r="4"
          className="trend-dot"
        >
          <title>
            {entry.date}：平均 {entry.averageScore} 分，作答 {entry.attempts} 次
          </title>
        </circle>
      ))}
      {labels.map((index) => (
        <text
          key={index}
          x={x(index)}
          y="200"
          textAnchor="middle"
        >
          {trend[index].date.slice(5)}
        </text>
      ))}
    </svg>
  )
}
