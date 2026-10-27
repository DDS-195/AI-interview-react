// 并行获取知识状态与资料摘要，详情原文由页面按需加载。
import { useEffect, useState } from 'react'
import {
  knowledgeRequest,
  type KnowledgeDocumentItem,
  type KnowledgeStatus
} from '../utils/knowledgeRequest'
export function useKnowledge() {
  const [data, setData] = useState<{
    status: KnowledgeStatus
    documents: KnowledgeDocumentItem[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    Promise.all([
      knowledgeRequest<KnowledgeStatus>('/status', undefined, controller.signal),
      knowledgeRequest<KnowledgeDocumentItem[]>('/documents', undefined, controller.signal)
    ])
      .then(([status, documents]) => {
        if (!controller.signal.aborted) {
          setData({ status, documents })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : '知识库加载失败')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [revision])
  return { data, loading, error, refresh: () => setRevision((value) => value + 1) }
}
