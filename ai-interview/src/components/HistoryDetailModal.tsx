// 优先展示作答时保存的题目和评分，避免用更新后的题目解释旧成绩。
import EvaluationContent from './EvaluationContent'
import { memo } from 'react'
import { Modal, Descriptions, Typography, Progress, theme, Spin, Alert, Button } from 'antd'
import type { HistoryRecord, Question, Category } from '../types'
import { getScoreColor } from '../utils/format'
import QuestionLabel from './QuestionLabel'

const { Paragraph } = Typography

interface HistoryDetailModalProps {
  open: boolean
  record: HistoryRecord | null
  question: Question | null
  categories: Category[]
  onClose: () => void
  loading?: boolean
  error?: string
  onRetry?: () => void
}

export default memo(function HistoryDetailModal({
  open,
  record,
  question,
  categories,
  onClose,
  loading = false,
  error = '',
  onRetry
}: HistoryDetailModalProps) {
  const { token } = theme.useToken()
  if (loading || error) {
    return (
      <Modal
        title="答题详情"
        open={open}
        onCancel={onClose}
        footer={null}
        width={640}
        className="history-detail-modal"
        destroyOnHidden
      >
        {error ? (
          <Alert
            type="error"
            showIcon
            message={error}
            action={<Button onClick={onRetry}>重试</Button>}
          />
        ) : (
          <Spin tip="正在加载详情…">
            <div style={{ height: 120 }} />
          </Spin>
        )}
      </Modal>
    )
  }
  if (!record || !question) {
    return (
      <Modal
        title="答题详情"
        open={open}
        onCancel={onClose}
        footer={null}
        width={640}
        className="history-detail-modal"
        destroyOnHidden
      >
        <div style={{ textAlign: 'center', padding: 20, color: token.colorTextSecondary }}>
          题目已被删除，无法查看详情
        </div>
      </Modal>
    )
  }

  const categoryName = categories.find((c) => c.id === question.categoryId)?.name || '未知'
  const correctAnswer = record.correctAnswer
  const feedback = record.feedback

  return (
    <Modal
      title={
        <QuestionLabel
          category={categoryName}
          title={question.title}
        />
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      className="history-detail-modal"
      destroyOnHidden
    >
      {/* 题目内容 */}
      <Descriptions
        column={1}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="题目">{question.content}</Descriptions.Item>
        <Descriptions.Item label="你的回答">
          <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{record.answer}</Paragraph>
        </Descriptions.Item>
      </Descriptions>

      {/* AI 评估 */}
      {record.score !== undefined && (
        <div
          style={{
            background: token.colorFillAlter,
            color: token.colorText,
            borderRadius: 8,
            padding: 16,
            borderLeft: `3px solid ${getScoreColor(record.score)}`
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: feedback || correctAnswer ? 12 : 0
            }}
          >
            <Progress
              type="circle"
              percent={record.score}
              size={52}
              strokeColor={getScoreColor(record.score)}
              format={(p) => <span style={{ fontSize: 16, fontWeight: 700 }}>{p}</span>}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>得分 {record.score} 分</span>
          </div>

          <EvaluationContent evaluation={record} />
        </div>
      )}

      {record.score === undefined && (
        <div
          style={{
            textAlign: 'center',
            padding: 16,
            color: token.colorTextSecondary,
            fontSize: 13
          }}
        >
          暂无 AI 评估数据（可能评估失败或未完成）
        </div>
      )}

      <div
        style={{ textAlign: 'right', marginTop: 16, fontSize: 12, color: token.colorTextSecondary }}
      >
        提交时间：{new Date(record.submittedAt).toLocaleString('zh-CN')}
      </div>
    </Modal>
  )
})
