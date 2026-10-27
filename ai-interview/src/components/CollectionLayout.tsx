// 收藏和历史共用列表外壳；业务数据获取与写操作由页面负责。
import type { ReactNode } from 'react'
import { Alert, Button, Card, Pagination, Popconfirm } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import type { Category, PagedData } from '../types'
import CategoryPieChart from './CategoryPieChart'

interface CollectionLayoutProps {
  title: ReactNode
  chartTitle: string
  emptyText: string
  clearTitle: string
  clearLabel: string
  data: Pick<PagedData<unknown>, 'total' | 'page' | 'pageSize' | 'distribution'>
  categories: Category[]
  loading: boolean
  error: string
  onRetry: () => void
  onBack: () => void
  onClearAll: () => void
  onPageChange: (page: number) => void
  children: ReactNode
}

export function categoryName(categories: Category[], id?: string) {
  return categories.find((category) => category.id === id)?.name || '未知'
}

// 收藏和历史共用布局、错误恢复、分页和图表；各自只负责列表及详情。
export default function CollectionLayout(props: CollectionLayoutProps) {
  const { data, categories, loading, error, children } = props
  const distribution = data.distribution.map((item) => ({
    name: categoryName(categories, item.categoryId),
    value: item.value
  }))
  return (
    <div className="page-with-chart">
      <div className="page-chart-left">
        <Card
          className="page-card"
          title={props.title}
          extra={
            <Button
              className="btn-outline"
              icon={<ArrowLeftOutlined />}
              onClick={props.onBack}
            >
              返回题目
            </Button>
          }
        >
          {error ? (
            <Alert
              type="error"
              showIcon
              message={error}
              action={<Button onClick={props.onRetry}>重试</Button>}
            />
          ) : (
            <>
              {children}
              {data.total > 0 && (
                <>
                  <div className="collection-clear">
                    <Popconfirm
                      title={props.clearTitle}
                      description="此操作不可撤销"
                      onConfirm={props.onClearAll}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        size="small"
                        danger
                        disabled={loading}
                      >
                        {props.clearLabel}
                      </Button>
                    </Popconfirm>
                  </div>
                  <div className="collection-pagination">
                    <Pagination
                      current={data.page}
                      pageSize={data.pageSize}
                      total={data.total}
                      showSizeChanger={false}
                      disabled={loading}
                      onChange={props.onPageChange}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      </div>
      <div className="page-chart-right">
        <CategoryPieChart
          data={distribution}
          title={props.chartTitle}
          emptyText={loading ? '正在加载…' : props.emptyText}
        />
      </div>
    </div>
  )
}
