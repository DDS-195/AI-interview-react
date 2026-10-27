// 评分弹窗只接收已确认结果，计算和持久化在后端完成。
import { Modal, Progress } from 'antd'
import EvaluationContent from './EvaluationContent'
import type { AIEvaluation } from '../types'
import { getScoreColor } from '../utils/format'

function getScoreLabel(score: number): string {
  if (score >= 90) {
    return '优秀'
  }
  if (score >= 80) {
    return '良好'
  }
  if (score >= 60) {
    return '一般'
  }
  return '需改进'
}

interface EvaluationResultProps {
  evaluationResult: AIEvaluation | null
  visible: boolean
  onClose: () => void
}

export default function EvaluationResult({
  evaluationResult,
  visible,
  onClose
}: EvaluationResultProps) {
  if (!evaluationResult) {
    return null
  }

  const color = getScoreColor(evaluationResult.score)
  const label = getScoreLabel(evaluationResult.score)

  return (
    <Modal
      title="AI 评估结果"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="eval-modal"
      rootClassName="eval-modal-root"
      centered
    >
      <div className="eval-score-wrapper">
        <Progress
          type="circle"
          percent={evaluationResult.score}
          strokeColor={{ '0%': color, '100%': color }}
          size={100}
          format={(percent) => `${percent}`}
        />
        <div
          className="eval-score-text"
          style={{ color }}
        >
          {evaluationResult.score} 分 · {label}
        </div>
        <div style={{ fontSize: 12 }}>分数反映本题必要要求的完成度，可选拓展不扣分。</div>
      </div>

      <EvaluationContent evaluation={evaluationResult} />
    </Modal>
  )
}
