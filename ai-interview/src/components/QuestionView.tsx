import { Button, Space, Skeleton, Card } from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  StarOutlined,
  StarFilled,
  ReloadOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import type { Question } from '../types'

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
  onPrevQuestion: () => void
  onNextQuestion: () => void
  onToggleFavorite: () => void
  onRefreshQuestion: () => void
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
  onPrevQuestion,
  onNextQuestion,
  onToggleFavorite,
  onRefreshQuestion
}: QuestionViewProps) {
  const isEmpty = !isStreaming && !currentQuestion
  const showContent = (isStreaming && hasStarted) || (!isStreaming && !!currentQuestion)

  return (
    <Card
      className="question-card"
      title={
        isStreaming ? (
          <Space size={10}>
            <span style={{ fontWeight: 600, fontSize: 17 }}>
              {streamingTitle || '生成中...'}
            </span>
            <span className="difficulty-tag" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              生成中
            </span>
          </Space>
        ) : currentQuestion ? (
          <Space size={10}>
            <span style={{ fontWeight: 600, fontSize: 17 }}>{currentQuestion.title}</span>
            <span className={`difficulty-tag difficulty-${currentQuestion.difficulty || 'medium'}`}>
              {currentQuestion.difficulty === 'easy' ? '简单' : currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
            </span>
          </Space>
        ) : (
          <span style={{ fontWeight: 600, fontSize: 17 }}>AI 面试助手</span>
        )
      }
      extra={
        <Space>
          {currentQuestion && (
            <>
              <Button
                type="text"
                className="btn-ghost"
                icon={isFavorite ? <StarFilled style={{ color: '#f59e0b' }} /> : <StarOutlined />}
                onClick={onToggleFavorite}
              />
              <Button
                type="text"
                className="btn-ghost"
                icon={<ReloadOutlined />}
                onClick={onRefreshQuestion}
                title="随机切换"
              />
            </>
          )}
        </Space>
      }
    >
      {/* 空状态 */}
      {isEmpty && (
        <div className="empty-state">
          <div className="icon"><QuestionCircleOutlined /></div>
          <h3>请选择题目分类</h3>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>从左侧选择一个分类开始答题</p>
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
          {isStreaming && (
            <div className="streaming-indicator">
              <span>AI 正在生成题目</span>
              <span className="streaming-dots">
                <span /><span /><span />
              </span>
            </div>
          )}

          <div className={`content-body${isStreaming ? ' streaming' : ''}`}>
            {isStreaming
              ? (streamingContent || '...')
              : (currentQuestion?.content || '')
            }
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
              disabled={isStreaming}
            >
              {isStreaming ? '生成中' : nextButtonText}
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

