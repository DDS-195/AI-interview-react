// 答案输入只负责编辑和提交事件；是否展示代码编辑器跟随当前题目。
import { Suspense, lazy } from 'react'
import { Card, Input, Button, Spin } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'
import type { CodeLanguage } from '../types'

const { TextArea } = Input
const LazyCodeEditor = lazy(() => import('./CodeEditor'))

interface AnswerAreaProps {
  codeLanguage?: CodeLanguage
  answerText: string
  isCodingCategory: boolean
  isEvaluatingAnswer: boolean
  isGeneratingQuestion: boolean
  onAnswerChange: (value: string) => void
  onSubmitAnswer: () => void
  onClearAnswer: () => void
}

export default function AnswerArea({
  codeLanguage,
  answerText,
  isCodingCategory,
  isEvaluatingAnswer,
  isGeneratingQuestion,
  onAnswerChange,
  onSubmitAnswer,
  onClearAnswer
}: AnswerAreaProps) {
  return (
    <Card
      title="你的答案"
      className="answer-card"
    >
      {isCodingCategory && (
        <Suspense
          fallback={
            <Spin
              style={{
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          }
        >
          <LazyCodeEditor
            value={answerText}
            onChange={onAnswerChange}
            visible
            disabled={isGeneratingQuestion}
            language={codeLanguage}
          />
        </Suspense>
      )}

      <div style={{ display: isCodingCategory ? 'none' : undefined }}>
        <TextArea
          rows={5}
          value={answerText}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="请输入你的答案..."
          aria-label="你的答案"
          disabled={isGeneratingQuestion}
          className="answer-textarea"
        />
      </div>

      <div className="answer-actions">
        <Button
          className="btn-outline"
          icon={<ClearOutlined />}
          onClick={onClearAnswer}
          disabled={!answerText.trim()}
        >
          清空
        </Button>
        <Button
          type="primary"
          className="btn-primary"
          icon={<SendOutlined />}
          onClick={onSubmitAnswer}
          loading={isEvaluatingAnswer}
          disabled={!answerText.trim() || isGeneratingQuestion}
        >
          提交答案
        </Button>
      </div>
    </Card>
  )
}
