// 网络数据需要逐项检查，校验知识快照后才能作为可展示的评分依据。
import type { KnowledgeSnapshot } from '../types'
export function parseKnowledgeSnapshot(value: unknown): KnowledgeSnapshot | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!value || typeof value !== 'object') {
    throw new Error('知识依据格式无效')
  }
  const data = value as Record<string, unknown>
  if (
    !['grounded', 'unavailable'].includes(String(data.status)) ||
    !['semantic', 'hybrid', 'keyword'].includes(String(data.method)) ||
    typeof data.retrievedAt !== 'string' ||
    !Number.isFinite(Date.parse(data.retrievedAt)) ||
    !Array.isArray(data.evidence) ||
    data.evidence.length > 5 ||
    (data.status === 'grounded') !== !!data.evidence.length
  ) {
    throw new Error('知识依据格式无效')
  }
  for (const item of data.evidence) {
    if (
      !item ||
      typeof item !== 'object' ||
      !Number.isInteger(item.revision) ||
      item.revision < 1 ||
      [
        'id',
        'documentId',
        'documentVersionId',
        'title',
        'heading',
        'text',
        'technicalVersion',
        'contentHash',
        'kind'
      ].some((key) => typeof item[key] !== 'string') ||
      typeof item.url !== 'string' ||
      !item.url.startsWith('https://')
    ) {
      throw new Error('知识来源格式无效')
    }
  }
  return data as unknown as KnowledgeSnapshot
}
