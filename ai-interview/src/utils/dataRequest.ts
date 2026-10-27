// 业务数据 API 的薄封装，超时和外部取消信号交给 requestJSON 统一处理。
import { requestJSON } from './httpRequest'

export async function dataRequest<T>(
  path = '',
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  return requestJSON<T>(`/api/data${path}`, {
    method,
    signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
}
