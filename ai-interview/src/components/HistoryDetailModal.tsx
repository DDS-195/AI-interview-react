import { memo, useMemo } from 'react'
import { Modal, Tag, Descriptions, Typography, Progress } from 'antd'
import type { HistoryRecord, Question, Category } from '../types'
import { loadHistoryDetail } from '../utils/localStorage'
import { getScoreColor, formatParagraphs } from '../utils/format'

const { Paragraph } = Typography

interface HistoryDetailModalProps {
  open: boolean
  record: HistoryRecord | null
  question: Question | null
  categories: Category[]
  onClose: () => void
}

export default memo(function HistoryDetailModal({
  open,
  record,
  question,
  categories,
  onClose
}: HistoryDetailModalProps) {
  // 优先用内嵌数据，否则从拆分 key 加载
  const detail = useMemo<{ correctAnswer?: string; feedback?: string } | null>(() => {
    if (!record) return null
    if (record.correctAnswer || record.feedback) {
      return { correctAnswer: record.correctAnswer, feedback: record.feedback }
    }
    return loadHistoryDetail(record.submittedAt)
  }, [record])

  if (!record || !question) {
    return (
      <Modal title="答题详情" open={open} onCancel={onClose} footer={null} destroyOnHidden>
        <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
          题目已被删除，无法查看详情
        </div>
      </Modal>
    )
  }

  const categoryName = categories.find(c => c.id === question.categoryId)?.name || '未知'
  const correctAnswer: string | undefined = detail?.correctAnswer
  const feedback: string | undefined = detail?.feedback

  return (
    <Modal
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color="purple">{categoryName}</Tag>
          {question.title}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      className="history-detail-modal"
      destroyOnHidden
    >
      {/* 题目内容 */}
      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="题目">{question.content}</Descriptions.Item>
        <Descriptions.Item label="你的回答">
          <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{record.answer}</Paragraph>
        </Descriptions.Item>
      </Descriptions>

      {/* AI 评估 */}
      {record.score !== undefined && (
        <div style={{
          background: '#f9fafb',
          borderRadius: 8,
          padding: 16,
          borderLeft: `3px solid ${getScoreColor(record.score)}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: feedback || correctAnswer ? 12 : 0 }}>
            <Progress
              type="circle"
              percent={record.score}
              size={52}
              strokeColor={getScoreColor(record.score)}
              format={(p) => <span style={{ fontSize: 16, fontWeight: 700 }}>{p}</span>}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              得分 {record.score} 分
            </span>
          </div>

          {feedback && (
            <div style={{ marginBottom: correctAnswer ? 10 : 0 }}>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>评估反馈</div>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{formatParagraphs(feedback)}</div>
            </div>
          )}

          {correctAnswer && (
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>参考答案</div>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}>
                {formatParagraphs(correctAnswer)}
              </div>
            </div>
          )}
        </div>
      )}

      {record.score === undefined && (
        <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 13 }}>
          暂无 AI 评估数据（可能评估失败或未完成）
        </div>
      )}

      <div style={{ textAlign: 'right', marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
        提交时间：{new Date(record.submittedAt).toLocaleString('zh-CN')}
      </div>
    </Modal>
  )
})
