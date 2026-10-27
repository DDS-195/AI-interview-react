// 只对构建静态文件协商预生成 gzip，避免压缩或缓冲 SSE 实时消息。
const fs = require('node:fs/promises')
const path = require('node:path')

// 只处理构建后的静态资源；API 和 SSE 不经过压缩或缓冲。
module.exports = function compressedStatic(directory) {
  const root = path.resolve(directory)
  return async (req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || req.headers.range) {
      return next()
    }
    res.vary('Accept-Encoding')
    if (req.acceptsEncodings('gzip', 'identity') !== 'gzip') {
      return next()
    }
    let pathname
    try {
      pathname = decodeURIComponent(req.path)
    } catch {
      return next()
    }
    if (pathname === '/') {
      pathname = '/index.html'
    }
    if (!/\.(js|css|html|svg)$/.test(pathname)) {
      return next()
    }
    const original = path.resolve(root, `.${pathname}`)
    if (!original.startsWith(root + path.sep)) {
      return next()
    }
    const compressed = `${original}.gz`
    try {
      const [source, zipped] = await Promise.all([fs.stat(original), fs.stat(compressed)])
      if (!source.isFile() || !zipped.isFile() || zipped.mtimeMs < source.mtimeMs) {
        return next()
      }
    } catch {
      return next()
    }
    res.type(path.extname(original))
    res.setHeader('Content-Encoding', 'gzip')
    res.sendFile(compressed, { acceptRanges: false }, (error) => {
      if (!error) {
        return
      }
      if (!res.headersSent) {
        res.removeHeader('Content-Encoding')
        res.removeHeader('Content-Type')
      }
      if (error.code === 'ENOENT') {
        next()
      } else {
        next(error)
      }
    })
  }
}
