// 区分回答原文证据和技术资料引用；有来源不等于技术结论已获认证。
import { Collapse, Tag, Typography } from 'antd'
import type { KnowledgeSnapshot } from '../types'
export default function KnowledgeEvidencePanel({
  snapshot,
  preview = false
}: {
  snapshot?: KnowledgeSnapshot
  preview?: boolean
}) {
  if (!snapshot) {
    return null
  }
  if (snapshot.status === 'unavailable') {
    return (
      <Typography.Paragraph type="secondary">
        本题使用常规出题，当前知识范围暂无可用依据。
      </Typography.Paragraph>
    )
  }
  return (
    <div className="knowledge-evidence">
      <Tag color="blue">{snapshot.method === 'keyword' ? '知识点匹配' : '知识库增强'}</Tag>
      <Collapse
        size="small"
        items={[
          {
            key: 'sources',
            label: preview ? '查看检索到的参考资料' : '查看本题知识依据（出题时保存）',
            children: snapshot.evidence.map((item) => (
              <div
                className="knowledge-evidence-item"
                key={item.id}
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.title}
                </a>
                <Typography.Paragraph type="secondary">
                  {item.technicalVersion} · 资料版本 {item.revision}
                </Typography.Paragraph>
                <p style={{ whiteSpace: 'pre-wrap' }}>{item.text}</p>
              </div>
            ))
          }
        ]}
      />
    </div>
  )
}
