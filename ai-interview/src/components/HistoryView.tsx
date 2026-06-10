import { memo, useMemo, useState, useEffect, useCallback } from 'react'
import { Card, List, Button, Typography, Empty, Popconfirm, Tag, Pagination } from 'antd'
import { DeleteOutlined, EyeOutlined, ArrowLeftOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { HistoryRecord, Question, Category } from '../types'
import CategoryPieChart from './CategoryPieChart'
import HistoryDetailModal from './HistoryDetailModal'

const { Text } = Typography
const PAGE_SIZE = 6

interface HistoryViewProps {
  historyRecords: HistoryRecord[]
  questions: Question[]
  categories: Category[]
  onDeleteRecord: (record: HistoryRecord) => void
  onClearAll: () => void
  onBack: () => void
}

export default memo(function HistoryView({
  historyRecords,
  questions,
  categories,
  onDeleteRecord,
  onClearAll,
  onBack
}: HistoryViewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)

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

  // 计算分类分布
  const pieData = useMemo(() => {
    const countMap = new Map<string, number>()
    historyRecords.forEach(rec => {
      const q = questionMap.get(rec.questionId)
      if (q) {
        const name = categoryMap.get(q.categoryId) || '未知'
        countMap.set(name, (countMap.get(name) || 0) + 1)
      }
    })
    return Array.from(countMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [historyRecords, questionMap, categoryMap])

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

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(historyRecords.length / PAGE_SIZE))
    if (currentPage > maxPage) setCurrentPage(maxPage)
  }, [historyRecords.length, currentPage])

  const handleView = useCallback((record: HistoryRecord) => setSelectedRecord(record), [])
  const handleCloseModal = useCallback(() => setSelectedRecord(null), [])

  const selectedQuestion = useMemo(() => {
    if (!selectedRecord) return null
    return questionMap.get(selectedRecord.questionId) || null
  }, [selectedRecord, questionMap])

  const start = (currentPage - 1) * PAGE_SIZE
  const pagedData = historyRecords.slice(start, start + PAGE_SIZE)

  const listCard = (
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
        <>
          <List
            dataSource={pagedData}
            renderItem={(record) => (
              <List.Item
                actions={[
                  <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
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
          {historyRecords.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 2 }}>
              <Popconfirm
                title="确定要清空全部历史记录吗？"
                description="此操作不可撤销"
                onConfirm={onClearAll}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger style={{ fontSize: 12 }}>清空全部历史</Button>
              </Popconfirm>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={historyRecords.length}
              showSizeChanger={false}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </Card>
  )

  return (
    <>
      <div className="page-with-chart">
        <div className="page-chart-left">{listCard}</div>
        <div className="page-chart-right">
          <CategoryPieChart
            data={pieData}
            title="答题分类分布"
            emptyText="暂无答题记录"
          />
        </div>
      </div>
      <HistoryDetailModal
        open={!!selectedRecord}
        record={selectedRecord}
        question={selectedQuestion}
        categories={categories}
        onClose={handleCloseModal}
      />
    </>
  )
})
