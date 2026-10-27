// 通过资源 Hook 读取指定历史，关闭或切换目标时清理旧请求。
import HistoryDetailModal from './HistoryDetailModal'
import { useDataResource } from '../hooks/useDataResource'
import { CATEGORIES } from '../utils/catalog'
import type { HistoryDetail } from '../types'

export default function SavedHistoryModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, loading, error, retry } = useDataResource<HistoryDetail>(
    id ? `/history/${encodeURIComponent(id)}` : null
  )
  return (
    <HistoryDetailModal
      open={Boolean(id)}
      record={data?.record || null}
      question={data?.question || null}
      categories={CATEGORIES}
      onClose={onClose}
      loading={loading}
      error={error}
      onRetry={retry}
    />
  )
}
