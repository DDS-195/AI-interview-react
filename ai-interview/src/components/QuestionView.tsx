// 流式预览与已保存题目共用展示区，预览内容不会直接写入题库。
import { Button, Space, Skeleton, Card, Tag } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  StarOutlined,
  StarFilled,
  ReloadOutlined,
  QuestionCircleOutlined,
  RetweetOutlined
} from '@ant-design/icons'
import type { Question } from '../types'
import { APP_NAME } from '../config'
import { categoryName, questionMode, QUESTION_MODES } from '../utils/catalog'

interface QuestionViewProps {
  currentQuestion: Question | null
  currentQuestionIndex: number
  currentQuestions: Question[]
  hasStarted: boolean
  nextButtonText: string
  isFavorite: boolean
  isCodingCategory: boolean
  streamingContent: string
  streamingTitle: string
  isStreaming: boolean
  isRestoring?: boolean
  onPrevQuestion: () => void
  onNextQuestion: () => void
  onToggleFavorite: () => void
  onRefreshQuestion: () => void
  onMarkReview?: () => void
  isMarkingReview?: boolean
}

export default function QuestionView({
  currentQuestion,
  currentQuestionIndex,
  currentQuestions,
  hasStarted,
  nextButtonText,
  isFavorite,
  isCodingCategory,
  streamingContent,
  streamingTitle,
  isStreaming,
  isRestoring = false,
  onPrevQuestion,
  onNextQuestion,
  onToggleFavorite,
  onRefreshQuestion,
  onMarkReview,
  isMarkingReview = false
}: QuestionViewProps) {
  const isEmpty = !isStreaming && !currentQuestion
  const showContent = (isStreaming && hasStarted) || (!isStreaming && !!currentQuestion)

  return (
    <Card
      className="question-card"
      title={
        isStreaming ? (
          <Space size={10}>
            <span style={{ fontWeight: 600, fontSize: 17 }}>{streamingTitle || '生成中...'}</span>
            <span
              className="difficulty-tag"
              style={{ background: '#e0e7ff', color: '#4338ca' }}
            >
              生成中
            </span>
          </Space>
        ) : currentQuestion ? (
          <Space size={10}>
            <span style={{ fontWeight: 600, fontSize: 17 }}>{currentQuestion.title}</span>
            <span className={`difficulty-tag difficulty-${currentQuestion.difficulty || 'medium'}`}>
              {currentQuestion.difficulty === 'easy'
                ? '简单'
                : currentQuestion.difficulty === 'medium'
                  ? '中等'
                  : '困难'}
            </span>
          </Space>
        ) : (
          <span style={{ fontWeight: 600, fontSize: 17 }}>{APP_NAME}</span>
        )
      }
      extra={
        <Space>
          {currentQuestion && (
            <>
              {onMarkReview && (
                <Button
                  type="text"
                  className="btn-ghost"
                  icon={<RetweetOutlined />}
                  onClick={onMarkReview}
                  aria-label="标记待复习"
                  title="标记待复习"
                  disabled={isStreaming || isMarkingReview}
                  loading={isMarkingReview}
                />
              )}
              <Button
                type="text"
                className="btn-ghost"
                icon={isFavorite ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />}
                onClick={onToggleFavorite}
                aria-label={isFavorite ? '取消收藏' : '收藏题目'}
                disabled={isStreaming}
              />
              <Button
                type="text"
                className="btn-ghost"
                icon={<ReloadOutlined />}
                onClick={onRefreshQuestion}
                title="随机切换"
                aria-label="随机切换题目"
                disabled={isStreaming || currentQuestions.length < 2}
              />
            </>
          )}
        </Space>
      }
    >
      {/* 空状态 */}
      {isEmpty && (
        <div className="empty-state">
          <div className="icon">
            <QuestionCircleOutlined />
          </div>
          <h3>开始练习</h3>
          <p>切换分类自动出题，也可点击生成新题目。</p>
          <Button
            type="primary"
            disabled={isRestoring}
            onClick={onNextQuestion}
          >
            生成新题目
          </Button>
        </div>
      )}

      {/* 骨架屏：代码题5行，其他3行 */}
      {isStreaming && !hasStarted && (
        <div className="skeleton-container">
          <Skeleton
            active
            title={{ width: '60%' }}
            paragraph={
              isCodingCategory
                ? { rows: 5, width: ['90%', '85%', '70%', '80%', '50%'] }
                : { rows: 3, width: ['90%', '70%', '50%'] }
            }
          />
        </div>
      )}

      {/* 流式生成中 / 已完成的题目 — 共用同一个内容区 */}
      {showContent && (
        <>
          {!isStreaming && currentQuestion && (
            <div className="question-metadata">
              <Tag>{categoryName(currentQuestion.categoryId)}</Tag>
              <Tag>
                {QUESTION_MODES.find((mode) => mode.id === questionMode(currentQuestion))?.name}
              </Tag>
              {currentQuestion.topic && <span>{currentQuestion.topic}</span>}
            </div>
          )}
          {isStreaming && (
            <div className="streaming-indicator">
              <span>AI 正在生成题目</span>
              <span className="streaming-dots">
                <span />
                <span />
                <span />
              </span>
            </div>
          )}

          {!isStreaming && currentQuestion?.knowledgeSnapshot?.status === 'grounded' && (
            <Tag color="blue">知识库增强</Tag>
          )}
          <div className={`content-body${isStreaming ? ' streaming' : ''}`}>
            {isStreaming ? streamingContent || '...' : currentQuestion?.content || ''}
          </div>

          {/* 导航按钮 — 只有非流式且有题目时可用 */}
          <div className="nav-buttons">
            <Button
              className="btn-outline"
              icon={<LeftOutlined />}
              disabled={isStreaming || currentQuestionIndex === 0}
              onClick={onPrevQuestion}
            >
              上一题
            </Button>

            <span className="page-indicator">
              {currentQuestions.length > 0
                ? `${currentQuestionIndex + 1} / ${currentQuestions.length}`
                : '0 / 0'}
            </span>

            <Button
              type="primary"
              className="btn-primary"
              icon={<RightOutlined />}
              onClick={onNextQuestion}
              loading={isStreaming}
              disabled={isStreaming || isRestoring}
            >
              {isStreaming ? '生成中' : nextButtonText}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
