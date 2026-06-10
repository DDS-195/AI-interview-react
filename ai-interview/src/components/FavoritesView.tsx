import { memo, useMemo, useState, useEffect } from 'react'
import { Card, List, Button, Typography, Empty, Tag, Popconfirm, Pagination } from 'antd'
import { DeleteOutlined, EyeOutlined, ArrowLeftOutlined, StarFilled } from '@ant-design/icons'
import type { FavoriteQuestion, Question, Category } from '../types'
import CategoryPieChart from './CategoryPieChart'

const { Text } = Typography
const PAGE_SIZE = 6

interface FavoritesViewProps {
  favoriteQuestions: FavoriteQuestion[]
  questions: Question[]
  categories: Category[]
  onLoadFavorite: (fav: FavoriteQuestion) => void
  onRemoveFavorite: (fav: FavoriteQuestion) => void
  onClearAll: () => void
  onBack: () => void
}

export default memo(function FavoritesView({
  favoriteQuestions,
  questions,
  categories,
  onLoadFavorite,
  onRemoveFavorite,
  onClearAll,
  onBack
}: FavoritesViewProps) {
  const [currentPage, setCurrentPage] = useState(1)

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
    favoriteQuestions.forEach(fav => {
      const q = questionMap.get(fav.questionId)
      if (q) {
        const name = categoryMap.get(q.categoryId) || '未知'
        countMap.set(name, (countMap.get(name) || 0) + 1)
      }
    })
    return Array.from(countMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [favoriteQuestions, questionMap, categoryMap])

  const getQuestionInfo = (fav: FavoriteQuestion) => {
    const q = questionMap.get(fav.questionId)
    return {
      title: q?.title || '已删除的题目',
      content: q?.content || '',
      categoryName: q ? (categoryMap.get(q.categoryId) || '未知') : '未知'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(favoriteQuestions.length / PAGE_SIZE))
    if (currentPage > maxPage) setCurrentPage(maxPage)
  }, [favoriteQuestions.length, currentPage])

  const start = (currentPage - 1) * PAGE_SIZE
  const pagedData = favoriteQuestions.slice(start, start + PAGE_SIZE)

  const listCard = (
    <Card
      className="page-card"
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StarFilled style={{ color: '#f59e0b' }} />
          我的收藏
        </span>
      }
      extra={
        <Button className="btn-outline" icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回题目
        </Button>
      }
    >
      {favoriteQuestions.length === 0 ? (
        <div className="page-empty">
          <Empty description="暂无收藏题目" />
        </div>
      ) : (
        <>
          <List
            dataSource={pagedData}
            renderItem={(fav) => {
              const info = getQuestionInfo(fav)
              return (
                <List.Item
                  actions={[
                    <Button key="view" type="link" icon={<EyeOutlined />} onClick={() => onLoadFavorite(fav)}>
                      查看
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="确定要取消收藏吗？"
                      onConfirm={() => onRemoveFavorite(fav)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>取消收藏</Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <span className="list-item-meta">
                        <Tag color="blue">{info.categoryName}</Tag>
                        <span style={{ fontWeight: 500 }}>{info.title}</span>
                      </span>
                    }
                    description={
                      <>
                        <Text ellipsis style={{ color: '#6b7280', display: 'block', marginBottom: 4 }}>
                          {info.content}
                        </Text>
                        <span className="list-item-date">收藏于 {formatDate(fav.addedAt)}</span>
                      </>
                    }
                  />
                </List.Item>
              )
            }}
          />
          {favoriteQuestions.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: 2 }}>
              <Popconfirm
                title="确定要取消全部收藏吗？"
                description="此操作不可撤销"
                onConfirm={onClearAll}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger style={{ fontSize: 12 }}>取消全部收藏</Button>
              </Popconfirm>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={favoriteQuestions.length}
              showSizeChanger={false}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      )}
    </Card>
  )

  return (
    <div className="page-with-chart">
      <div className="page-chart-left">{listCard}</div>
      <div className="page-chart-right">
        <CategoryPieChart
          data={pieData}
          title="收藏分类分布"
          emptyText="暂无收藏数据"
        />
      </div>
    </div>
  )
})
