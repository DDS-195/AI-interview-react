// Worker 串行加载和推理；取消可跳过排队任务，但不保证立即中断底层计算。
const { parentPort, workerData } = require('node:worker_threads')
const { modelDirectory } = require('../services/knowledge/localModel')
let extractor
let loading
async function prepare() {
  if (extractor) {
    return
  }
  loading ||= (async () => {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.cacheDir = workerData.cacheDir
    env.allowRemoteModels = false
    extractor = await pipeline('feature-extraction', modelDirectory(workerData.revision), {
      dtype: 'q8',
      device: 'cpu'
    })
  })().catch((error) => {
    loading = null
    throw error
  })
  await loading
}
let queue = Promise.resolve()
const active = new Set()
const cancelled = new Set()
parentPort.on('message', (message) => {
  if (message.action === 'cancel') {
    if (active.has(message.id)) {
      cancelled.add(message.id)
    }
    return
  }
  active.add(message.id)
  queue = queue.then(async () => {
    try {
      if (cancelled.has(message.id)) {
        return
      }
      await prepare()
      if (cancelled.has(message.id)) {
        return
      }
      if (message.action === 'prepare') {
        parentPort.postMessage({ id: message.id, result: true })
        return
      }
      const inputs = message.texts.map(
        (text) => (message.kind === 'passage' ? 'passage: ' : 'query: ') + text
      )
      for (const input of inputs) {
        const tokens = extractor.tokenizer(input, { truncation: false })
        if (tokens.input_ids.dims[1] > 512) {
          throw new Error('知识片段超过本地模型512 token限制，请按语义缩短片段')
        }
      }
      // 推理开始后即使收到取消，也不保证底层计算立即停止；主线程会丢弃迟到结果。
      const vectors = (
        await extractor(inputs, { pooling: 'mean', normalize: true, truncation: false })
      ).tolist()
      if (
        vectors.length !== inputs.length ||
        vectors.some(
          (vector) =>
            vector.length !== workerData.dimension || vector.some((v) => !Number.isFinite(v))
        )
      ) {
        throw new Error('本地模型输出维度无效')
      }
      parentPort.postMessage({ id: message.id, result: vectors })
    } catch (error) {
      parentPort.postMessage({
        id: message.id,
        error: /512 token|维度/.test(error.message)
          ? error.message
          : '本地向量模型加载失败，请检查模型缓存或网络'
      })
    } finally {
      active.delete(message.id)
      cancelled.delete(message.id)
    }
  })
})
