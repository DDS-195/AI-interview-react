// 发送响应前统一错误状态和提示；SSE 已发头后的错误由流协议处理。
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
      ? error.status
      : 500
  let message = status < 500 ? error.message : '本地服务暂不可用，请重试'
  if (error.type === 'entity.parse.failed') {
    message = '请求 JSON 格式无效'
  }
  if (status === 413) {
    message = '请求内容过大'
  }
  if (status >= 500) {
    console.error(`本地请求失败：${req.method} ${req.path}（${status}）`)
  }
  res.status(status).json({ error: message })
}

function aiError(error, fallback) {
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.name === 'TimeoutError'
  ) {
    return { status: 504, message: 'AI 请求超时，请重试' }
  }
  return { status: error.status || 502, message: error.status ? error.message : fallback }
}

module.exports = { errorHandler, aiError }
