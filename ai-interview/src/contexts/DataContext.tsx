// 业务摘要和写操作的共享入口；MySQL 是长期数据来源，Context 只维护界面快照。
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import { Alert, Button, Spin } from 'antd'
import type { DataSummary, DataChange } from '../types'
import { readLegacyData, markLegacyMigrated } from '../utils/legacyData'
import { dataRequest } from '../utils/dataRequest'

interface DataContextType {
  data: DataSummary
  revision: number
  mutate: (path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown) => Promise<void>
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextType | null>(null)

async function request(path = '', method = 'GET', body?: unknown): Promise<DataSummary> {
  const result = await dataRequest<DataSummary>(path, method, body)
  if (!result.counts || !Array.isArray(result.favorites)) {
    throw new Error('本地数据响应格式无效')
  }
  return result
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataSummary | null>(null)
  const [revision, setRevision] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [attempt, setAttempt] = useState(0)
  // 仅串行当前页面的写请求；跨窗口一致性仍由后端事务与唯一键处理。
  const queue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let active = true
    setLoadError('')
    async function load() {
      let loaded = await request()
      if (!active) {
        return
      }
      const legacy = readLegacyData()
      if (legacy && (legacy.questions.length || legacy.favorites.length || legacy.history.length)) {
        loaded = await request('/import', 'POST', legacy)
      }
      if (active) {
        if (legacy) {
          markLegacyMigrated()
        }
        setData(loaded)
      }
    }
    load().catch((error) => {
      if (active) {
        setLoadError(error instanceof Error ? error.message : '本地数据加载失败')
      }
    })
    return () => {
      active = false
    }
  }, [attempt])

  const mutate = useCallback((path: string, method: 'PUT' | 'POST' | 'DELETE', body?: unknown) => {
    // 生成题目、收藏和提交按操作顺序保存，避免响应次序导致界面回退。
    const operation = queue.current.then(async () => {
      try {
        const change = await dataRequest<DataChange>(path, method, body)
        if (!change.counts) {
          throw new Error('本地数据响应格式无效')
        }
        setData((previous) => {
          if (!previous) {
            return previous
          }
          let favorites = previous.favorites
          if (change.clearFavorites) {
            favorites = []
          } else if (change.removedFavoriteId) {
            favorites = favorites.filter((f) => f.questionId !== change.removedFavoriteId)
          } else if (change.favorite) {
            favorites = [
              change.favorite,
              ...favorites.filter((f) => f.questionId !== change.favorite!.questionId)
            ]
          }
          return { counts: change.counts, favorites }
        })
        setRevision((value) => value + 1)
        setSaveError('')
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : '本地数据保存失败')
        throw error
      }
    })
    queue.current = operation.catch(() => {})
    return operation
  }, [])

  const refresh = useCallback(() => {
    const operation = queue.current.then(async () => {
      setData(await request())
      setRevision((value) => value + 1)
    })
    queue.current = operation.catch(() => {})
    return operation
  }, [])

  const value = useMemo(
    () => (data ? { data, revision, mutate, refresh } : null),
    [data, revision, mutate, refresh]
  )

  if (!value) {
    return (
      <div style={{ maxWidth: 560, margin: '20vh auto', padding: 24 }}>
        {loadError ? (
          <Alert
            type="error"
            showIcon
            message="无法加载本地数据"
            description={loadError}
            action={<Button onClick={() => setAttempt((value) => value + 1)}>重试</Button>}
          />
        ) : (
          <Spin tip="正在加载本地数据…">
            <div style={{ height: 80 }} />
          </Spin>
        )}
      </div>
    )
  }

  return (
    <DataContext.Provider value={value}>
      {saveError && (
        <Alert
          type="error"
          showIcon
          message="操作未保存"
          description={`${saveError}。请检查本地服务后重新操作。`}
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            maxWidth: '90vw'
          }}
        />
      )}
      {children}
    </DataContext.Provider>
  )
}

export function useDataContext() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider')
  }
  return context
}
