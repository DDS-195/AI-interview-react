const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const http = require('node:http')
const { gzipSync, gunzipSync } = require('node:zlib')
const express = require('express')
const compressedStatic = require('../services/compressedStatic')
let directory
let server
let base
const content = 'const message = "中文测试";\n'.repeat(1000)
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-static-test-'))
  await fs.writeFile(path.join(directory, 'app.js'), content)
  await fs.writeFile(path.join(directory, 'app.js.gz'), gzipSync(Buffer.from(content)))
  await fs.writeFile(path.join(directory, 'plain.css'), 'body{color:red}')
  const app = express()
  app.get('/api/stream', (_req, res) => {
    res.type('text/event-stream')
    res.end('data: 内容\n\n')
  })
  app.use(compressedStatic(directory))
  app.use(express.static(directory))
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
after(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()))
  assert.ok(path.basename(directory).startsWith('ai-static-test-'))
  await fs.rm(directory, { recursive: true, force: true })
})
function request(route, encoding, method = 'GET') {
  return new Promise((resolve, reject) => {
    http
      .get(base + route, { method, headers: { 'Accept-Encoding': encoding } }, (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () =>
          resolve({ headers: res.headers, body: Buffer.concat(chunks), status: res.statusCode })
        )
        res.on('error', reject)
      })
      .on('error', reject)
  })
}
test('真实 HTTP 发送 gzip 内容，解压与原文件一致，类型和协商头正确', async () => {
  const zipped = await request('/app.js', 'gzip')
  assert.equal(zipped.status, 200)
  assert.equal(zipped.headers['content-encoding'], 'gzip')
  assert.match(zipped.headers['content-type'], /javascript/)
  assert.match(zipped.headers.vary, /Accept-Encoding/)
  assert.ok(zipped.body.length < Buffer.byteLength(content) / 10)
  assert.equal(gunzipSync(zipped.body).toString(), content)
  const head = await request('/app.js', 'gzip', 'HEAD')
  assert.equal(Number(head.headers['content-length']), zipped.body.length)
  assert.equal(head.body.length, 0)
})
test('客户端禁用 gzip、无预压缩文件和 SSE 均返回原始内容', async () => {
  for (const encoding of ['identity', 'gzip;q=0, identity;q=1']) {
    const plain = await request('/app.js', encoding)
    assert.equal(plain.headers['content-encoding'], undefined)
    assert.equal(plain.body.toString(), content)
  }
  const css = await request('/plain.css', 'gzip')
  assert.equal(css.headers['content-encoding'], undefined)
  assert.equal(css.body.toString(), 'body{color:red}')
  const stream = await request('/api/stream', 'gzip')
  assert.equal(stream.headers['content-encoding'], undefined)
  assert.equal(stream.body.toString(), 'data: 内容\n\n')
})
