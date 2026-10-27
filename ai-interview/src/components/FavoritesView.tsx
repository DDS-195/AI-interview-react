// 收藏列表展示服务端分页摘要，打开练习时再读取完整题目。
import { memo } from 'react'
import { List, Button, Typography, Empty, Popconfirm } from 'antd'
import { DeleteOutlined, EyeOutlined, StarFilled } from '@ant-design/icons'
import type { FavoriteQuestion, FavoriteListItem, PagedData, Category } from '../types'
import CollectionLayout, { categoryName } from './CollectionLayout'
import QuestionLabel from './QuestionLabel'

const { Text } = Typography
interface FavoritesViewProps {
  data: PagedData<FavoriteListItem>
  loading: boolean
  loadingId: string
  error: string
  onPageChange: (page: number) => void
  onRetry: () => void
  categories: Category[]
  onLoadFavorite: (fav: FavoriteQuestion) => void
  onRemoveFavorite: (fav: FavoriteQuestion) => void
  onClearAll: () => void
  onBack: () => void
}
export default memo(function FavoritesView({
  data,
  loading,
  loadingId,
  error,
  onPageChange,
  onRetry,
  categories,
  onLoadFavorite,
  onRemoveFavorite,
  onClearAll,
  onBack
}: FavoritesViewProps) {
  return (
    <CollectionLayout
      title={
        <span className="list-item-meta">
          <StarFilled style={{ color: '#f59e0b' }} />
          我的收藏
        </span>
      }
      chartTitle="收藏分类分布"
      emptyText="暂无收藏数据"
      clearTitle="确定要取消全部收藏吗？"
      clearLabel="取消全部收藏"
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
        rowKey="questionId"
        locale={{
          emptyText: loading ? (
            '正在加载…'
          ) : (
            <div className="page-empty">
              <Empty description="暂无收藏题目" />
            </div>
          )
        }}
        renderItem={(fav) => (
          <List.Item
            actions={[
              <Button
                key="view"
                type="link"
                icon={<EyeOutlined />}
                loading={loadingId === fav.questionId}
                disabled={!fav.question || (!!loadingId && loadingId !== fav.questionId)}
                onClick={() => onLoadFavorite(fav)}
              >
                查看
              </Button>,
              <Popconfirm
                key="delete"
                title="确定要取消收藏吗？"
                onConfirm={() => onRemoveFavorite(fav)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                >
                  取消收藏
                </Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              title={
                <QuestionLabel
                  category={categoryName(categories, fav.question?.categoryId)}
                  title={fav.question?.title || '已删除的题目'}
                  color="blue"
                />
              }
              description={
                <>
                  <Text
                    ellipsis
                    type="secondary"
                    style={{ display: 'block', marginBottom: 4 }}
                  >
                    {fav.preview}
                  </Text>
                  <span className="list-item-date">
                    收藏于 {new Date(fav.addedAt).toLocaleString('zh-CN')}
                  </span>
                </>
              }
            />
          </List.Item>
        )}
      />
    </CollectionLayout>
  )
})
