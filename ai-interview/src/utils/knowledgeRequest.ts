// 知识 API 的地址与数据类型；检索预览不会直接生成面试题。
import { requestJSON } from './httpRequest'
export const knowledgeRequest = <T>(path: string, body?: unknown, signal?: AbortSignal) =>
  requestJSON<T>('/api/knowledge' + path, {
    method: body === undefined ? 'GET' : 'POST',
    signal,
    timeoutMs: 15000,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  })
export interface KnowledgeDocumentItem {
  id: string
  title: string
  sourceUrl: string
  categoryId: string
  topicIds: string[]
  technicalVersion: string
  chunks: number
}
export interface KnowledgeStatus {
  documents: number
  total: number
  indexed: number
  pending: number
  ready: boolean
  mode: 'off' | 'prefer'
  model: string
  dimension: number
}
