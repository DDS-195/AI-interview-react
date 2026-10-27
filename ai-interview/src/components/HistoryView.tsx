// 历史列表只取摘要，选中记录后加载详情；切换或关闭时取消旧详情请求。
import { memo, useState, useEffect } from 'react'
import { List, Button, Typography, Empty, Popconfirm } from 'antd'
import { DeleteOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { HistoryRecord, HistoryListItem, HistoryDetail, PagedData, Category } from '../types'
import { dataRequest } from '../utils/dataRequest'
import CollectionLayout, { categoryName } from './CollectionLayout'
import HistoryDetailModal from './HistoryDetailModal'
import QuestionLabel from './QuestionLabel'

const { Text } = Typography
interface HistoryViewProps {
  data: PagedData<HistoryListItem>
  loading: boolean
  error: string
  onPageChange: (page: number) => void
  onRetry: () => void
  categories: Category[]
  onDeleteRecord: (record: Pick<HistoryRecord, 'submittedAt'>) => void
  onClearAll: () => void
  onBack: () => void
}
export default memo(function HistoryView({
  data,
  loading,
  error,
  onPageChange,
  onRetry,
  categories,
  onDeleteRecord,
  onClearAll,
  onBack
}: HistoryViewProps) {
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<HistoryDetail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setDetail(null)
    setDetailError('')
    if (!selectedId) {
      return
    }
    const controller = new AbortController()
    dataRequest<HistoryDetail>(
      `/history/${encodeURIComponent(selectedId)}`,
      'GET',
      undefined,
      controller.signal
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setDetail(result)
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setDetailError(reason instanceof Error ? reason.message : '详情加载失败')
        }
      })
    return () => controller.abort()
  }, [selectedId, attempt])
  return (
    <>
      <CollectionLayout
        title={
          <span className="list-item-meta">
            <ClockCircleOutlined style={{ color: '#5b5ef7' }} />
            答题历史
          </span>
        }
        chartTitle="答题分类分布"
        emptyText="暂无答题记录"
        clearTitle="确定要清空全部历史记录吗？"
        clearLabel="清空全部历史"
        data={data}
        categories={categories}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onBack={onBack}
        onClearAll={onClearAll}
        onPageChange={onPageChange}
      >
        <List
          loading={loading}
          dataSource={data.items}
          rowKey="submittedAt"
          locale={{
            emptyText: loading ? (
              '正在加载…'
            ) : (
              <div className="page-empty">
                <Empty description="暂无答题记录" />
              </div>
            )
          }}
          renderItem={(record) => (
            <List.Item
              actions={[
                <Button
                  key="view"
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => setSelectedId(record.submittedAt)}
                >
                  查看
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定要删除这条记录吗？"
                  onConfirm={() => onDeleteRecord(record)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={
                  <QuestionLabel
                    category={categoryName(categories, record.question?.categoryId)}
                    title={record.question?.title || '已删除的题目'}
                  />
                }
                description={
                  <>
                    <Text
                      ellipsis
                      type="secondary"
                      style={{ display: 'block', marginBottom: 4 }}
                    >
                      {record.preview}
                    </Text>
                    <span className="list-item-date">
                      {new Date(record.submittedAt).toLocaleString('zh-CN')}
                    </span>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </CollectionLayout>
      <HistoryDetailModal
        open={!!selectedId}
        record={detail?.record || null}
        question={detail?.question || null}
        categories={categories}
        loading={!!selectedId && !detail && !detailError}
        error={detailError}
        onRetry={() => setAttempt((value) => value + 1)}
        onClose={() => setSelectedId('')}
      />
    </>
  )
})
