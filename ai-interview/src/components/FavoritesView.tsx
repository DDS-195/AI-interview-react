import { memo, useMemo } from 'react'
import { Card, List, Button, Typography, Empty, Tag, Popconfirm } from 'antd'
import { DeleteOutlined, EyeOutlined, ArrowLeftOutlined, StarFilled } from '@ant-design/icons'
import type { FavoriteQuestion, Question, Category } from '../types'

const { Text } = Typography

interface FavoritesViewProps {
  favoriteQuestions: FavoriteQuestion[]
  questions: Question[]
  categories: Category[]
  onLoadFavorite: (fav: FavoriteQuestion) => void
  onRemoveFavorite: (fav: FavoriteQuestion) => void
  onBack: () => void
}

export default memo(function FavoritesView({
  favoriteQuestions,
  questions,
  categories,
  onLoadFavorite,
  onRemoveFavorite,
  onBack
}: FavoritesViewProps) {
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

  return (
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
        <List
          dataSource={favoriteQuestions}
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
      )}
    </Card>
  )
})
