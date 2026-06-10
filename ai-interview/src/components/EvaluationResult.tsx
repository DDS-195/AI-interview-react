import { Modal, Progress } from 'antd'
import type { AIEvaluation } from '../types'
import { getScoreColor, formatParagraphs } from '../utils/format'

function getScoreLabel(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 60) return '一般'
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
  if (!evaluationResult) return null

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
      centered
    >
      <div className="eval-score-wrapper">
        <Progress
          type="circle"
          percent={evaluationResult.score}
          strokeColor={{ '0%': color, '100%': color }}
          size={100}
          format={percent => `${percent}`}
        />
        <div className="eval-score-text" style={{ color }}>
          {evaluationResult.score} 分 · {label}
        </div>
      </div>

      <div className="eval-section">
        <div className="eval-section-title">评估反馈</div>
        <div className="eval-section-content">{formatParagraphs(evaluationResult.feedback)}</div>
      </div>

      {evaluationResult.correctAnswer && (
        <div className="eval-section">
          <div className="eval-section-title">参考答案 / 改进方向</div>
          <div className="eval-section-content">{formatParagraphs(evaluationResult.correctAnswer)}</div>
        </div>
      )}

      {evaluationResult.suggestions && evaluationResult.suggestions.length > 0 && (
        <div className="eval-section">
          <div className="eval-section-title">改进建议</div>
          {evaluationResult.suggestions.map((s, i) => (
            <div key={i} className="eval-suggestion-item">
              <div className="eval-suggestion-num">{i + 1}</div>
              <span style={{ fontSize: 14 }}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
