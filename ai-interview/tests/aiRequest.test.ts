import { afterEach, describe, expect, it, vi } from 'vitest'
import { evaluateAIAnswer, generateAIQuestionStream } from '../src/utils/aiRequest'

afterEach(() => vi.unstubAllGlobals())

describe('答案评估', () => {
  it.each(['hybrid', 'semantic'])(
    '保留%s知识依据和分项引用，异常资料结构不能作为成功评分',
    async (method) => {
      const snapshot = {
        status: 'grounded',
        method,
        retrievedAt: '2026-10-12T00:00:00.000Z',
        indexProfile: '0'.repeat(64),
        retrievalVersion: 'retrieval-v1',
        evidence: [
          {
            id: 'chunk',
            documentId: 'document',
            documentVersionId: 'version',
            revision: 1,
            title: '清理顺序',
            url: 'https://react.dev/reference/react/useEffect',
            heading: '清理',
            text: '卸载时清理',
            technicalVersion: 'React 18',
            contentHash: '0'.repeat(64),
            kind: 'concept'
          }
        ]
      }
      const value = {
        score: 100,
        feedback: '完成必要要求',
        submittedAt: '2026-10-12T00:00:01.000Z',
        referenceStatus: 'grounded',
        knowledgeSnapshot: snapshot,
        criteria: [
          {
            id: 'p1',
            description: '说明清理',
            maxPoints: 100,
            points: 100,
            verdict: 'met',
            evidence: '卸载清理',
            explanation: '符合要求',
            sourceIds: ['chunk']
          }
        ]
      }
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(value)))
      const result = await evaluateAIAnswer('题目', '卸载清理')
      expect(result.referenceStatus).toBe('grounded')
      expect(result.knowledgeSnapshot).toEqual(snapshot)
      expect(result.criteria?.[0].sourceIds).toEqual(['chunk'])
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          Response.json({
            ...value,
            knowledgeSnapshot: { status: 'grounded', evidence: 'invalid' }
          })
        )
      )
      await expect(evaluateAIAnswer('题目', '回答')).rejects.toThrow('知识依据格式无效')
    }
  )
  it('保留真实的 0 分', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ score: 0, feedback: '回答错误', submittedAt: '2026-10-11T00:00:00.000Z' })
        )
    )
    expect((await evaluateAIAnswer('题目', '回答')).score).toBe(0)
  })
  it('HTTP 失败不能显示评估成功', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: '模型不可用' }, { status: 500 }))
    )
    await expect(evaluateAIAnswer('题目', '回答')).rejects.toThrow('模型不可用')
  })
  it('网络失败不能生成虚假的评分', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('网络连接失败')))
    await expect(evaluateAIAnswer('题目', '回答')).rejects.toThrow('网络连接失败')
  })
  it.each([
    { feedback: '缺少评分' },
    { score: '88' },
    { score: null },
    { score: 120, feedback: '越界' },
    { score: 80, feedback: { invalid: true } }
  ])('拒绝无效评分 %j', async (value) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(value)))
    await expect(evaluateAIAnswer('题目', '回答')).rejects.toThrow()
  })
})

async function stream(bytes: Uint8Array[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            bytes.forEach((chunk) => controller.enqueue(chunk))
            controller.close()
          }
        })
      )
    )
  )
  const chunk = vi.fn()
  const done = vi.fn()
  const error = vi.fn()
  generateAIQuestionStream('react', [], chunk, done, error)
  await vi.waitFor(() => expect(done.mock.calls.length + error.mock.calls.length).toBe(1), {
    timeout: 500
  })
  return { chunk, done, error }
}

describe('流式出题', () => {
  const encode = (value: string) => new TextEncoder().encode(value)
  it('缺少结束消息时报告错误，结束生成状态', async () => {
    const result = await stream([encode('data: {"content":"部分内容"}\n\n')])
    expect(result.done).not.toHaveBeenCalled()
    expect(result.error).toHaveBeenCalledOnce()
  })
  it('处理没有末尾换行的最后一条结束消息', async () => {
    const result = await stream([
      encode('data: {"done":true,"title":"标题","body":"中文内容","difficulty":"medium"}')
    ])
    expect(result.done).toHaveBeenCalledWith('标题', '中文内容', 'medium', '')
    expect(result.error).not.toHaveBeenCalled()
  })
  it('跨字节、跨行的中文仍能完整解码', async () => {
    const text = encode(
      'data: {"content":"中文😀"}\r\n\r\ndata: {"done":true,"title":"题目","body":"中文😀","difficulty":"medium"}\n\n'
    )
    const result = await stream(Array.from(text, (byte) => new Uint8Array([byte])))
    expect(result.done).toHaveBeenCalledWith('题目', '中文😀', 'medium', '')
  })
  it('服务端错误只通知一次', async () => {
    const result = await stream([encode('data: {"error":"额度不足"}\n\n')])
    expect(result.error).toHaveBeenCalledWith('额度不足')
    expect(result.done).not.toHaveBeenCalled()
  })
  it('非法元信息必须通知错误，不能静默结束', async () => {
    const result = await stream([
      encode('data: {"done":true,"title":"题目","body":"正文","difficulty":"easy/medium/hard"}\n\n')
    ])
    expect(result.error).toHaveBeenCalledOnce()
    expect(result.done).not.toHaveBeenCalled()
  })
  it('损坏消息不会导致生成状态无限等待', async () => {
    const result = await stream([encode('data: {broken}\n\n')])
    expect(result.error).toHaveBeenCalledOnce()
  })
})
