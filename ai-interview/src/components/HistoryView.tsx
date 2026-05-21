import { memo, useMemo } from 'react'
import { Card, List, Button, Typography, Empty, Popconfirm, Tag } from 'antd'
import { DeleteOutlined, EyeOutlined, ArrowLeftOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { HistoryRecord, Question, Category } from '../types'

const { Text } = Typography

interface HistoryViewProps {
  historyRecords: HistoryRecord[]
  questions: Question[]
  categories: Category[]
  onLoadRecord: (record: HistoryRecord) => void
  onDeleteRecord: (record: HistoryRecord) => void
  onBack: () => void
}

export default memo(function HistoryView({
  historyRecords,
  questions,
  categories,
  onLoadRecord,
  onDeleteRecord,
  onBack
}: HistoryViewProps) {
  const questionMap = useMemo(() => {
    const map = new Map<string, Question>()
    questions.forEach(q => map.set(q.id, q))
    return map
  }, [questions])

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach(c => map.set(c.id, c.name))
    return map
  }, [categories])

  const getQuestionTitle = (record: HistoryRecord) => {
    return questionMap.get(record.questionId)?.title || '已删除的题目'
  }

  const getCategoryName = (record: HistoryRecord) => {
    const q = questionMap.get(record.questionId)
    return q ? (categoryMap.get(q.categoryId) || '未知') : '未知'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  return (
    <Card
      className="page-card"
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: '#5b5ef7' }} />
          答题历史
        </span>
      }
      extra={
        <Button className="btn-outline" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回题目
        </Button>
      }
    >
      {historyRecords.length === 0 ? (
        <div className="page-empty">
          <Empty description="暂无答题记录" />
        </div>
      ) : (
        <List
          dataSource={historyRecords}
          renderItem={(record) => (
            <List.Item
              actions={[
                <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => onLoadRecord(record)}>
                  查看
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定要删除这条记录吗？"
                  onConfirm={() => onDeleteRecord(record)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={
                  <span className="list-item-meta">
                    <Tag color="purple">{getCategoryName(record)}</Tag>
                    <span style={{ fontWeight: 500 }}>{getQuestionTitle(record)}</span>
                  </span>
                }
                description={
                  <>
                    <Text ellipsis style={{ color: '#6b7280', display: 'block', marginBottom: 4 }}>
                      {record.answer}
                    </Text>
                    <span className="list-item-date">{formatDate(record.submittedAt)}</span>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
})
