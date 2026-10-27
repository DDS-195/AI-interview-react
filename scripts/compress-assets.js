// 构建后生成静态 gzip 文件，是否发送压缩版本由后端按请求头决定。
const fs = require('node:fs/promises')
const path = require('node:path')
const { gzipSync } = require('node:zlib')

async function compress(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await compress(file)
    } else if (/\.(js|css|html|svg)$/.test(entry.name)) {
      await fs.writeFile(`${file}.gz`, gzipSync(await fs.readFile(file)))
    }
  }
}
compress(path.join(__dirname, '../ai-interview/dist')).catch((error) => {
  console.error('静态资源压缩失败:', error.message)
  process.exitCode = 1
})
