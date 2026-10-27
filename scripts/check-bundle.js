// 按 manifest 统计入口和默认练习页的静态 JS gzip；这个预算不是页面加载耗时。
const fs = require('node:fs')
const path = require('node:path')
const { gzipSync } = require('node:zlib')
const assert = require('node:assert/strict')
const dist = path.join(__dirname, '../ai-interview/dist')
const manifest = JSON.parse(fs.readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'))
const visited = new Set()
function include(key) {
  if (visited.has(key)) {
    return
  }
  visited.add(key)
  for (const dependency of manifest[key].imports || []) {
    include(dependency)
  }
}
include('index.html')
// 面试题目是默认页面，将它的静态依赖也计入首屏预算。
include('src/pages/QuestionPage.tsx')
let bytes = 0
let originalBytes = 0
for (const key of visited) {
  const file = path.join(dist, manifest[key].file)
  const original = fs.readFileSync(file)
  const compressed = fs.readFileSync(`${file}.gz`)
  assert.equal(compressed.length, gzipSync(original).length, '预压缩资源与构建内容不一致')
  originalBytes += original.length
  bytes += compressed.length
}
const budget = 450 * 1024
console.log(`首屏 JavaScript（gzip）：${(bytes / 1024).toFixed(1)} KiB，预算 ${budget / 1024} KiB`)
console.log(
  `未压缩大小：${(originalBytes / 1024).toFixed(1)} KiB；已生成供本地服务发送的 gzip 文件`
)
assert.ok(bytes <= budget, '首屏 JavaScript 超过预算，请检查图表或编辑器是否被提前引入')
