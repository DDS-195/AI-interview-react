// 当前评分与历史详情共用展示，兼容没有分项和知识依据的旧记录。
import { theme, Tag } from 'antd'
import type { AIEvaluation } from '../types'
import { formatParagraphs } from '../utils/format'
import KnowledgeEvidencePanel from './KnowledgeEvidence'

const labels = { met: '满足', partial: '部分满足', missed: '未回答', incorrect: '有错误' }
export default function EvaluationContent({ evaluation }: { evaluation: Partial<AIEvaluation> }) {
  const { token } = theme.useToken()
  return (
    <div
      className="assessment-details"
      style={{ overflowWrap: 'anywhere', color: token.colorText }}
    >
      {evaluation.feedback && (
        <div className="eval-section">
          <div className="eval-section-title">评估反馈</div>
          <div className="eval-section-content">{formatParagraphs(evaluation.feedback)}</div>
        </div>
      )}
      {!!evaluation.criteria?.length && (
        <div className="eval-section">
          <div className="eval-section-title">得分依据</div>
          {evaluation.criteria.map((item) => (
            <div
              key={item.id}
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <strong style={{ flex: '1 1 160px' }}>{item.description}</strong>
                <Tag
                  color={
                    item.verdict === 'met' ? 'green' : item.verdict === 'partial' ? 'gold' : 'red'
                  }
                >
                  {labels[item.verdict]}
                </Tag>
                <span>
                  {item.points} / {item.maxPoints} 分
                </span>
              </div>
              <div style={{ marginTop: 6 }}>{item.explanation}</div>
              {item.evidence && (
                <div
                  style={{ marginTop: 6, whiteSpace: 'pre-wrap', color: token.colorTextSecondary }}
                >
                  回答依据：{item.evidence}
                </div>
              )}
              {!!item.sourceIds?.length && (
                <div style={{ marginTop: 6, color: token.colorTextSecondary }}>
                  技术依据：
                  {item.sourceIds
                    .map(
                      (id) =>
                        evaluation.knowledgeSnapshot?.evidence.find((source) => source.id === id)
                          ?.title
                    )
                    .filter(Boolean)
                    .join('、')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {evaluation.correctAnswer && (
        <div className="eval-section">
          <div className="eval-section-title">
            {evaluation.referenceStatus === 'grounded'
              ? '知识库辅助参考要点'
              : evaluation.referenceStatus === 'verified'
                ? '已核对参考要点'
                : evaluation.referenceStatus === 'generated'
                  ? 'AI 参考要点'
                  : '参考答案'}
          </div>
          <div
            className="eval-section-content"
            style={{
              whiteSpace: 'pre-wrap',
              background: token.colorBgContainer,
              color: token.colorText,
              padding: 12,
              borderRadius: 6
            }}
          >
            {formatParagraphs(evaluation.correctAnswer)}
          </div>
          {evaluation.referenceStatus === 'generated' && (
            <div style={{ marginTop: 8, color: token.colorTextSecondary, fontSize: 12 }}>
              可结合官方文档核对技术细节，合理的不同解法同样有效。
            </div>
          )}
          {!!evaluation.sources?.length && (
            <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {evaluation.sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      <KnowledgeEvidencePanel snapshot={evaluation.knowledgeSnapshot} />
      {!!evaluation.suggestions?.length && (
        <div className="eval-section">
          <div className="eval-section-title">改进建议</div>
          {evaluation.suggestions.map((item, index) => (
            <div
              key={index}
              className="eval-suggestion-item"
            >
              <div className="eval-suggestion-num">{index + 1}</div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      {!!evaluation.uncertainties?.length && (
        <div className="eval-section">
          <div className="eval-section-title">待核对事项</div>
          {evaluation.uncertainties.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      )}
    </div>
  )
}
