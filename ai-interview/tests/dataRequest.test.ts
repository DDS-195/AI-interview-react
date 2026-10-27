import { afterEach, expect, it, vi } from 'vitest'
import { dataRequest } from '../src/utils/dataRequest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('非JSON错误使用HTTP状态，不暴露JSON解析异常', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('<html>proxy error</html>', { status: 502 }))
  )
  await expect(dataRequest()).rejects.toThrow('HTTP 502')
})
it('成功但无效的JSON响应明确报错', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('invalid')))
  await expect(dataRequest()).rejects.toThrow('响应格式无效')
})
it('超时终止卡住的请求，同时保留调用方主动取消', async () => {
  vi.useFakeTimers()
  const fetcher = vi.fn(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), {
          once: true
        })
      })
  )
  vi.stubGlobal('fetch', fetcher)
  const pending = dataRequest().catch((error) => error)
  await vi.advanceTimersByTimeAsync(15001)
  expect((await pending).message).toMatch(/超时/)
  const controller = new AbortController()
  const cancelled = dataRequest('', 'GET', undefined, controller.signal).catch((error) => error)
  controller.abort()
  expect((await cancelled).name).toBe('AbortError')
  expect(vi.getTimerCount()).toBe(0)
})
