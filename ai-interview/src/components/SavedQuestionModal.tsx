// 已有题目详情按 ID 获取，不重新生成题目或评分规则。
import { Alert, Button, Collapse, Modal, Spin, Tag } from 'antd'
import { useDataResource } from '../hooks/useDataResource'
import type { Question } from '../types'
import { categoryName } from '../utils/catalog'
import KnowledgeEvidencePanel from './KnowledgeEvidence'

export default function SavedQuestionModal({
  id,
  onClose,
  onPractice,
  loadingId
}: {
  id: string
  onClose: () => void
  onPractice: (id: string) => void
  loadingId: string
}) {
  const {
    data: question,
    loading,
    error,
    retry
  } = useDataResource<Question>(id ? `/questions/${encodeURIComponent(id)}` : null)
  return (
    <Modal
      title={question?.title || '题目详情'}
      open={Boolean(id)}
      onCancel={onClose}
      width={680}
      footer={
        <Button
          type="primary"
          disabled={!question || Boolean(loadingId)}
          loading={loadingId === id}
          onClick={() => onPractice(id)}
        >
          练习本题
        </Button>
      }
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button onClick={retry}>重试</Button>}
        />
      ) : loading ? (
        <Spin>
          <div style={{ height: 160 }} />
        </Spin>
      ) : (
        question && (
          <>
            <div className="learning-tags">
              <Tag>{categoryName(question.categoryId)}</Tag>
              {question.topic && <Tag>{question.topic}</Tag>}
            </div>
            <div className="saved-question-content">{question.content}</div>
            {(question.referenceAnswer || question.rubric?.length) && (
              <Collapse
                items={[
                  {
                    key: 'answer',
                    label: '参考答案与评分要点',
                    children: (
                      <>
                        {question.referenceAnswer && (
                          <div className="saved-question-content">{question.referenceAnswer}</div>
                        )}
                        {question.rubric?.map((point) => (
                          <div
                            className="saved-rubric-point"
                            key={point.id}
                          >
                            <strong>
                              {point.description} · {point.weight} 分
                            </strong>
                            <p>{point.expected}</p>
                          </div>
                        ))}
                        <KnowledgeEvidencePanel snapshot={question.knowledgeSnapshot} />
                      </>
                    )
                  }
                ]}
              />
            )}
          </>
        )
      )}
    </Modal>
  )
}
