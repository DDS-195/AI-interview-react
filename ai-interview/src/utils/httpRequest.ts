// 统一 HTTP 状态错误、JSON 解析、超时与取消，计时覆盖响应正文读取。
interface RequestOptions extends RequestInit {
  timeoutMs?: number
}

export async function responseError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.error === 'string') {
      return body.error
    }
    if (typeof body?.message === 'string') {
      return body.message
    }
  } catch {
    /* 代理或服务端的非 JSON 错误使用状态码。 */
  }
  return `请求失败（HTTP ${response.status}）`
}

// 数据和评分共享错误、超时、取消处理；计时覆盖响应正文读取。
export async function requestJSON<T>(
  url: string,
  { timeoutMs = 15000, signal, ...options }: RequestOptions = {}
): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort(signal?.reason)
  if (signal?.aborted) {
    cancel()
  } else {
    signal?.addEventListener('abort', cancel, { once: true })
  }
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) {
      throw new Error(await responseError(response))
    }
    try {
      return await response.json()
    } catch (error) {
      if (controller.signal.aborted) {
        throw error
      }
      throw new Error('服务响应格式无效，请重试')
    }
  } catch (error) {
    if (timedOut) {
      throw new Error('请求超时，请检查本地服务后重试')
    }
    throw error
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}
