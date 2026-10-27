// 收藏和历史共用分页请求；数据 revision 变化后重新读取当前页。
import { useState, useEffect } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { dataRequest } from '../utils/dataRequest'
import type { PagedData } from '../types'

export function usePagedData<T>(collection: 'history' | 'favorites') {
  const { revision } = useDataContext()
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [data, setData] = useState<PagedData<T>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 6,
    distribution: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    dataRequest<PagedData<T>>(
      `/${collection}?page=${page}&pageSize=6`,
      'GET',
      undefined,
      controller.signal
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result)
        }
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : '列表加载失败')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [collection, page, revision, attempt])
  return {
    data,
    loading,
    error,
    onPageChange: setPage,
    onRetry: () => setAttempt((value) => value + 1)
  }
}
