// 限制浏览器请求来自本机应用；来源检查不提供用户身份或多用户权限。
// 本机应用仅接受本机浏览器来源，防止其他网站盲发写入或付费 AI 请求。
module.exports = function localRequests(req, res, next) {
  const origin = req.headers.origin
  if (origin) {
    try {
      const url = new URL(origin)
      if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
        return res.status(403).json({ error: '仅允许本机页面访问' })
      }
    } catch {
      return res.status(403).json({ error: '请求来源无效' })
    }
  }
  if (req.headers['sec-fetch-site'] === 'cross-site' && !origin) {
    return res.status(403).json({ error: '仅允许本机页面访问' })
  }
  next()
}
