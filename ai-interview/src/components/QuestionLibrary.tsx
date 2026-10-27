// 题库和错题页的共用协调层：筛选、分页、详情及打开已有题目。
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Button, Empty, Pagination, Spin, message } from 'antd'
import LibraryFilters from './LibraryFilters'
import QuestionLibraryCard from './QuestionLibraryCard'
import SavedQuestionModal from './SavedQuestionModal'
import SavedHistoryModal from './SavedHistoryModal'
import { useDataResource } from '../hooks/useDataResource'
import { useOpenSavedQuestion } from '../hooks/useOpenSavedQuestion'
import { useDataContext } from '../contexts/DataContext'
import type { QuestionListData } from '../types'

export default function QuestionLibrary({
  reviews,
  onNavigateToQuestion
}: {
  reviews: boolean
  onNavigateToQuestion: () => void
}) {
  const [params, setParams] = useSearchParams()
  const requestParams = new URLSearchParams(params)
  requestParams.set('pageSize', '8')
  const resource = useDataResource<QuestionListData>(
    `/${reviews ? 'reviews' : 'questions'}?${requestParams}`
  )
  const { mutate } = useDataContext()
  const [messageApi, messages] = message.useMessage()
  const { open, loadingId } = useOpenSavedQuestion(onNavigateToQuestion, (error) => {
    messageApi.error(error)
  })
  const [detailId, setDetailId] = useState('')
  const [historyId, setHistoryId] = useState('')
  const [savingId, setSavingId] = useState('')
  const saving = useRef(false)
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (key !== 'page') {
      next.delete('page')
    }
    if (key === 'categoryId') {
      next.delete('topicId')
    }
    setParams(next, { replace: key !== 'page' })
  }
  async function mark(id: string, status: 'pending' | 'completed' | 'reset') {
    if (saving.current) {
      return
    }
    saving.current = true
    setSavingId(id)
    try {
      await mutate(`/reviews/${encodeURIComponent(id)}`, 'PUT', { status })
      messageApi.success(
        status === 'pending'
          ? '已加入复习'
          : status === 'completed'
            ? '已标记完成，新一次低分会重新进入待复习'
            : '已恢复自动判断'
      )
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : '复习状态保存失败')
    } finally {
      saving.current = false
      setSavingId('')
    }
  }
  const { data, loading, error, retry } = resource
  return (
    <div className="learning-page">
      {messages}
      <div className="learning-page-heading">
        <div>
          <h1>{reviews ? '错题复习' : '我的题库'}</h1>
          <p>
            {reviews
              ? '最近评分低于 80 分或手动标记的题目进入待复习；重练达到 80 分会自动完成。'
              : '已保存的题目随时练习，打开已有题目不会重新生成。'}
          </p>
        </div>
        <Button onClick={onNavigateToQuestion}>返回练习</Button>
      </div>
      <LibraryFilters
        values={params}
        reviews={reviews}
        onChange={change}
        onReset={() => setParams({}, { replace: true })}
      />
      {error ? (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button onClick={retry}>重试</Button>}
        />
      ) : loading ? (
        <div
          className="learning-loading"
          role="status"
        >
          <Spin tip="正在加载题目…">
            <div style={{ height: 160 }} />
          </Spin>
        </div>
      ) : (
        data && (
          <>
            <div
              className="library-result-count"
              role="status"
            >
              共 {data.total} 道题目{savingId && ' · 正在保存复习状态…'}
            </div>
            {data.items.length ? (
              <div className="library-card-grid">
                {data.items.map((item) => (
                  <QuestionLibraryCard
                    key={item.id}
                    item={item}
                    reviews={reviews}
                    opening={loadingId === item.id}
                    busy={Boolean(loadingId || savingId)}
                    onOpen={() => void open(item.id)}
                    onDetails={() => setDetailId(item.id)}
                    onHistory={() => setHistoryId(item.latestSubmittedAt || '')}
                    onMark={(status) => void mark(item.id, status)}
                  />
                ))}
              </div>
            ) : (
              <Empty description={reviews ? '当前筛选下没有复习题目' : '当前筛选下没有题目'} />
            )}
            {data.total > 0 && (
              <div className="learning-pagination">
                <Pagination
                  current={data.page}
                  pageSize={data.pageSize}
                  total={data.total}
                  showSizeChanger={false}
                  responsive
                  disabled={Boolean(savingId || loadingId)}
                  onChange={(page) => change('page', String(page))}
                />
              </div>
            )}
          </>
        )
      )}
      <SavedQuestionModal
        id={detailId}
        onClose={() => setDetailId('')}
        onPractice={(id) => void open(id)}
        loadingId={loadingId}
      />
      <SavedHistoryModal
        id={historyId}
        onClose={() => setHistoryId('')}
      />
    </div>
  )
}
