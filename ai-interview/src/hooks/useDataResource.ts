// 筛选路径或数据版本变化时取消旧请求，旧响应不能回写新页面。
import { useEffect, useState } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { dataRequest } from '../utils/dataRequest'

// 路由、筛选或数据版本变化时取消旧请求，避免慢响应覆盖当前页面。
export function useDataResource<T>(path: string | null) {
  const { revision } = useDataContext()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setData(null)
    setError('')
    setLoading(Boolean(path))
    if (path !== null) {
      dataRequest<T>(path, 'GET', undefined, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setData(result)
          }
        })
        .catch((reason) => {
          if (!controller.signal.aborted) {
            setError(reason instanceof Error ? reason.message : '数据加载失败')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false)
          }
        })
    }
    return () => controller.abort()
  }, [path, revision, attempt])
  return { data, loading, error, retry: () => setAttempt((value) => value + 1) }
}
