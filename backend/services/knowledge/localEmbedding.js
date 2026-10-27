// 主线程通过任务 ID 复用一个 Worker，管理队列上限、取消、超时与退出。
const { Worker } = require('node:worker_threads')
const path = require('node:path')
const { fail } = require('./validation')
function createLocalEmbedding(config) {
  let worker
  let sequence = 0
  let closed = false
  const pending = new Map()
  function start() {
    if (worker) {
      return
    }
    const current = new Worker(path.join(__dirname, '../../workers/localEmbedding.js'), {
      workerData: {
        model: config.model,
        revision: config.revision,
        dimension: config.dimension,
        cacheDir: path.join(__dirname, '../../.cache/embeddings')
      }
    })
    worker = current
    current.on('message', (message) => {
      const task = pending.get(message.id)
      if (!task) {
        return
      }
      message.error
        ? task.reject(Object.assign(new Error(message.error), { status: 503 }))
        : task.resolve(message.result)
    })
    const failed = () => {
      if (worker !== current) {
        return
      }
      for (const task of [...pending.values()]) {
        task.reject(Object.assign(new Error('本地向量模型进程异常，请重试'), { status: 503 }))
      }
      if (worker === current) {
        worker = null
      }
    }
    current.on('error', failed)
    current.on('exit', failed)
    current.unref()
  }
  // 每个任务独立管理取消和超时；清理 pending 后忽略 Worker 的迟到消息。
  function request(action, texts, signal, kind, timeout) {
    if (closed) {
      fail('本地向量模型已关闭', 503)
    }
    if (pending.size >= 8) {
      fail('本地向量模型繁忙，请稍后重试', 503)
    }
    signal?.throwIfAborted()
    start()
    const id = ++sequence
    const combined = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
      : AbortSignal.timeout(timeout)
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        pending.delete(id)
        combined.removeEventListener('abort', abort)
        if (!pending.size) {
          worker?.unref()
        }
      }
      const abort = () => {
        worker?.postMessage({ action: 'cancel', id })
        cleanup()
        reject(combined.reason)
      }
      pending.set(id, {
        resolve: (value) => {
          cleanup()
          resolve(value)
        },
        reject: (error) => {
          cleanup()
          reject(error)
        }
      })
      combined.addEventListener('abort', abort, { once: true })
      worker.ref()
      worker.postMessage({ id, action, texts, kind })
    })
  }
  return {
    prepare: (signal) => request('prepare', undefined, signal, undefined, 300000),
    embed(texts, signal, kind = 'query') {
      if (
        !Array.isArray(texts) ||
        !texts.length ||
        texts.length > 8 ||
        texts.some((text) => typeof text !== 'string' || !text.trim() || text.length > 8000)
      ) {
        fail('Embedding输入无效')
      }
      return request('embed', texts, signal, kind, 30000)
    },
    async close() {
      closed = true
      for (const task of [...pending.values()]) {
        task.reject(Object.assign(new Error('本地向量模型已关闭'), { status: 503 }))
      }
      const current = worker
      worker = null
      if (current) {
        await current.terminate()
      }
    }
  }
}
module.exports = { createLocalEmbedding }
