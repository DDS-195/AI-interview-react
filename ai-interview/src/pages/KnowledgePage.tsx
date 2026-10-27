// 资料查看和检索预览分别管理请求，改变检索条件时丢弃旧预览。
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Tag,
  Typography
} from 'antd'
import { useKnowledge } from '../hooks/useKnowledge'
import { knowledgeRequest, type KnowledgeDocumentItem } from '../utils/knowledgeRequest'
import { categoryName, categoryTopics, CURRENT_CATEGORIES } from '../utils/catalog'
import KnowledgeEvidencePanel from '../components/KnowledgeEvidence'
import type { KnowledgeSnapshot } from '../types'

interface Detail {
  title: string
  sourceUrl: string
  rawText: string
  metadata: { technicalVersion: string }
}
export default function KnowledgePage() {
  const { data, loading, error, refresh } = useKnowledge()
  const [selected, setSelected] = useState<KnowledgeDocumentItem | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailError, setDetailError] = useState('')
  const [categoryId, setCategory] = useState('react')
  const [topicId, setTopic] = useState('react:effects')
  const [query, setQuery] = useState('useEffect 清理')
  const [preview, setPreview] = useState<KnowledgeSnapshot | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [documentCategory, setDocumentCategory] = useState('all')
  const [documentQuery, setDocumentQuery] = useState('')
  const [page, setPage] = useState(1)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    const request = new AbortController()
    setDetail(null)
    setDetailError('')
    if (selected) {
      knowledgeRequest<Detail>('/documents/' + selected.id, undefined, request.signal)
        .then((value) => {
          if (!request.signal.aborted) {
            setDetail(value)
          }
        })
        .catch((error) => {
          if (!request.signal.aborted) {
            setDetailError(error.message)
          }
        })
    }
    return () => request.abort()
  }, [selected])
  function resetSearch() {
    controller.current?.abort()
    setSearching(false)
    setPreview(null)
    setSearchError('')
  }
  async function search() {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setSearching(true)
    setSearchError('')
    setPreview(null)
    try {
      const result = await knowledgeRequest<KnowledgeSnapshot>(
        '/search-preview',
        { categoryId, topicId, query },
        request.signal
      )
      if (!request.signal.aborted) {
        setPreview(result)
      }
    } catch (error) {
      if (!request.signal.aborted) {
        setSearchError(error instanceof Error ? error.message : '检索失败')
      }
    } finally {
      if (controller.current === request) {
        setSearching(false)
      }
    }
  }
  const status = data?.status
  const documents = (data?.documents || []).filter(
    (item) =>
      (documentCategory === 'all' || item.categoryId === documentCategory) &&
      item.title.toLocaleLowerCase().includes(documentQuery.trim().toLocaleLowerCase())
  )
  const currentPage = Math.min(page, Math.max(1, Math.ceil(documents.length / 10)))
  const visibleDocuments = documents.slice((currentPage - 1) * 10, currentPage * 10)
  return (
    <div className="learning-page knowledge-page">
      <div className="learning-page-heading">
        <div>
          <h1>技术知识库</h1>
          <p>查看面试参考资料，体验按知识点检索。</p>
        </div>
        <Button onClick={refresh}>刷新</Button>
      </div>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          action={<Button onClick={refresh}>重试</Button>}
        />
      )}
      {loading && !data ? (
        <Spin>
          <div style={{ minHeight: 180 }} />
        </Spin>
      ) : (
        status && (
          <>
            <Card
              title="参考资料"
              className="learning-card"
            >
              <Space wrap>
                <Tag color={status.ready ? 'green' : 'gold'}>
                  {status.ready ? '资料已准备' : '资料待准备'}
                </Tag>
                <Tag>{status.mode === 'off' ? '知识增强已关闭' : '知识增强已开启'}</Tag>
                <span>
                  {status.documents} 份资料 · {status.indexed} 个可检索片段
                  {status.pending > 0 && ` · ${status.pending} 个片段待准备`}
                </span>
              </Space>
              <p className="learning-note">
                资料覆盖部分常见考点；没有相关资料时继续使用常规出题。
              </p>
            </Card>
            <Card
              title="试试检索"
              className="learning-card"
            >
              <div className="knowledge-search">
                <Select
                  aria-label="检索分类"
                  value={categoryId}
                  options={CURRENT_CATEGORIES.map((item) => ({ value: item.id, label: item.name }))}
                  onChange={(value) => {
                    resetSearch()
                    setCategory(value)
                    setTopic(categoryTopics(value)[0]?.id || '')
                  }}
                />
                <Select
                  aria-label="检索知识点"
                  value={topicId}
                  showSearch
                  optionFilterProp="label"
                  options={categoryTopics(categoryId).map((item) => ({
                    value: item.id,
                    label: item.name
                  }))}
                  onChange={(value) => {
                    resetSearch()
                    setTopic(value)
                  }}
                />
                <Input
                  aria-label="检索内容"
                  value={query}
                  maxLength={1000}
                  placeholder="输入想了解的考点"
                  onChange={(event) => {
                    resetSearch()
                    setQuery(event.target.value)
                  }}
                  onPressEnter={() => {
                    if (query.trim() && topicId) {
                      void search()
                    }
                  }}
                />
                <Button
                  type="primary"
                  disabled={!query.trim() || !topicId}
                  loading={searching}
                  onClick={() => void search()}
                >
                  检索
                </Button>
              </div>
              {searchError && (
                <Alert
                  type="error"
                  showIcon
                  message={searchError}
                />
              )}
              {preview &&
                (preview.status === 'unavailable' ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={preview.reason || '没有找到相关资料'}
                  />
                ) : (
                  <KnowledgeEvidencePanel
                    snapshot={preview}
                    preview
                  />
                ))}
            </Card>
            <Card
              title="知识资料"
              className="learning-card"
            >
              <div className="knowledge-document-filters">
                <Select
                  aria-label="资料分类"
                  value={documentCategory}
                  showSearch
                  optionFilterProp="label"
                  options={[
                    { value: 'all', label: '全部分类' },
                    ...CURRENT_CATEGORIES.map((item) => ({ value: item.id, label: item.name }))
                  ]}
                  onChange={(value) => {
                    setDocumentCategory(value)
                    setPage(1)
                  }}
                />
                <Input
                  aria-label="搜索资料标题"
                  allowClear
                  value={documentQuery}
                  maxLength={200}
                  placeholder="搜索资料标题"
                  onChange={(event) => {
                    setDocumentQuery(event.target.value)
                    setPage(1)
                  }}
                />
                <span>共 {documents.length} 份</span>
              </div>
              {visibleDocuments.length ? (
                <div className="knowledge-document-list">
                  {visibleDocuments.map((item) => (
                    <div
                      className="knowledge-document"
                      key={item.id}
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <Typography.Paragraph type="secondary">
                          {categoryName(item.categoryId)} · {item.technicalVersion}
                        </Typography.Paragraph>
                      </div>
                      <Button onClick={() => setSelected(item)}>查看资料</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  description={data?.documents.length ? '没有符合条件的资料' : '暂无知识资料'}
                />
              )}
              {documents.length > 10 && (
                <Pagination
                  className="knowledge-pagination"
                  current={currentPage}
                  pageSize={10}
                  total={documents.length}
                  showSizeChanger={false}
                  onChange={setPage}
                />
              )}
            </Card>
          </>
        )
      )}
      <Modal
        title="知识资料"
        open={!!selected}
        onCancel={() => setSelected(null)}
        width={760}
        footer={<Button onClick={() => setSelected(null)}>关闭</Button>}
      >
        {detailError ? (
          <Alert
            type="error"
            message={detailError}
          />
        ) : detail ? (
          <>
            <h3>{detail.title}</h3>
            <a
              href={detail.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              打开核对来源
            </a>
            <Typography.Paragraph type="secondary">
              {detail.metadata.technicalVersion}
            </Typography.Paragraph>
            <pre className="knowledge-raw-text">{detail.rawText}</pre>
          </>
        ) : (
          <Spin>
            <div style={{ height: 160 }} />
          </Spin>
        )}
      </Modal>
    </div>
  )
}
