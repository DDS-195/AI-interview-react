import { Tag } from 'antd'

interface QuestionLabelProps {
  category: string
  title: string
  color?: string
}

export default function QuestionLabel({ category, title, color = 'purple' }: QuestionLabelProps) {
  return (
    <span className="question-label">
      <Tag color={color}>{category}</Tag>
      <span
        className="question-label-text"
        title={title}
      >
        {title}
      </span>
    </span>
  )
}
