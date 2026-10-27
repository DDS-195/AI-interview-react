// 题目卡片展示练习摘要；评分明细和参考答案在详情中按需读取。
import { Button, Card, Tag } from 'antd'
import type { QuestionListItem } from '../types'
import { categoryName, QUESTION_MODES } from '../utils/catalog'

export default function QuestionLibraryCard({
  item,
  reviews,
  opening,
  busy,
  onOpen,
  onDetails,
  onHistory,
  onMark
}: {
  item: QuestionListItem
  reviews: boolean
  opening: boolean
  busy: boolean
  onOpen: () => void
  onDetails: () => void
  onHistory: () => void
  onMark: (status: 'pending' | 'completed' | 'reset') => void
}) {
  return (
    <Card
      className="library-question-card"
      size="small"
    >
      <div className="learning-tags">
        <Tag>{categoryName(item.categoryId)}</Tag>
        <Tag
          color={
            item.difficulty === 'hard' ? 'red' : item.difficulty === 'medium' ? 'gold' : 'green'
          }
        >
          {{ easy: '简单', medium: '中等', hard: '困难' }[item.difficulty]}
        </Tag>
        <span>{QUESTION_MODES.find((mode) => mode.id === item.mode)?.name}</span>
        {item.reviewStatus && (
          <Tag color={item.reviewStatus === 'pending' ? 'orange' : 'green'}>
            {item.reviewStatus === 'pending' ? '待复习' : '复习已完成'}
          </Tag>
        )}
      </div>
      <h3>{item.title}</h3>
      {item.topic && <div className="library-topic">{item.topic}</div>}
      <p className="library-preview">{item.preview}</p>
      <div className="library-performance">
        <span>{item.attempts ? `作答 ${item.attempts} 次` : '尚未作答'}</span>
        {item.latestScore !== null && (
          <span>
            最近 <strong>{item.latestScore}</strong> 分
          </span>
        )}
        {reviews && item.firstScore !== null && <span>首次 {item.firstScore} 分</span>}
        {item.improvement !== null && (
          <span
            className={
              item.improvement > 0
                ? 'learning-positive'
                : item.improvement < 0
                  ? 'learning-negative'
                  : ''
            }
          >
            {item.improvement > 0
              ? `进步 ${item.improvement}`
              : item.improvement < 0
                ? `下降 ${Math.abs(item.improvement)}`
                : '持平'}
            {item.improvement !== 0 && ' 分'}
          </span>
        )}
      </div>
      {reviews && (
        <div className="library-review-reason">
          {item.reviewSource === 'manual' && item.reviewStatus === 'pending' && (
            <p>手动标记待复习</p>
          )}
          {!!item.lossPoints.length && (
            <>
              <strong>最近失分点</strong>
              <ul>
                {item.lossPoints.slice(0, 3).map((point, index) => (
                  <li key={index}>
                    {point.description}
                    <span>
                      {' '}
                      {point.points}/{point.maxPoints} 分
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!item.lossPoints.length &&
            item.latestScore !== null &&
            item.reviewStatus === 'pending' && <p>最近成绩低于 80 分，可查看反馈后重练。</p>}
        </div>
      )}
      <div className="library-actions">
        <Button
          type="primary"
          loading={opening}
          disabled={busy}
          onClick={onOpen}
        >
          练习本题
        </Button>
        <Button
          disabled={busy}
          onClick={onDetails}
        >
          查看题目
        </Button>
        {reviews && item.latestSubmittedAt && (
          <Button
            disabled={busy}
            onClick={onHistory}
          >
            评分详情
          </Button>
        )}
        {item.reviewStatus !== 'pending' ? (
          <Button
            disabled={busy}
            onClick={() => onMark('pending')}
          >
            加入复习
          </Button>
        ) : (
          <Button
            disabled={busy}
            onClick={() => onMark('completed')}
          >
            标记已完成
          </Button>
        )}
      </div>
    </Card>
  )
}
