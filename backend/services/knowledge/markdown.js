// 知识文件使用受限头部格式；先验证整批文件，再交给按篇事务导入。
const fs = require('node:fs/promises')
const path = require('node:path')
const { document } = require('./validation')
const { splitDocument } = require('./chunker')
const DIRECTORY = path.join(__dirname, '../../knowledge')

// 小型资料格式：头部每行一个字段，数组与字符串使用JSON值，其余部分就是Markdown正文。
function parseMarkdown(source) {
  const normalized = source.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '')
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error('资料需要以 --- 包围的头部字段')
  }
  const metadata = {}
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue
    }
    const entry = line.match(/^([a-zA-Z]+):\s*(.+)$/)
    if (!entry || Object.hasOwn(metadata, entry[1])) {
      throw new Error('资料头部字段格式无效或重复')
    }
    const value = entry[2].trim()
    metadata[entry[1]] = /^["[{]/.test(value) ? JSON.parse(value) : value
  }
  const result = { ...metadata, content: match[2].trim() }
  document(result) // 导入前检查分类、知识点、来源等，不执行Markdown里的代码。
  return result
}
function formatMarkdown({ content, ...metadata }) {
  return (
    '---\n' +
    Object.entries(metadata)
      .map(([key, value]) => key + ': ' + JSON.stringify(value))
      .join('\n') +
    '\n---\n\n' +
    content.trim() +
    '\n'
  )
}
async function readKnowledge(directory = DIRECTORY) {
  const documents = []
  async function visit(folder) {
    for (const item of (await fs.readdir(folder, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const file = path.join(folder, item.name)
      if (item.isDirectory()) {
        await visit(file)
      } else if (item.isFile() && item.name.endsWith('.md')) {
        try {
          const note = parseMarkdown(await fs.readFile(file, 'utf8'))
          // 先读完并验证整批文件，避免后面的代码围栏错误让脚本只导入前半批。
          splitDocument(note.content, note.title)
          documents.push(note)
        } catch (error) {
          throw new Error(path.relative(directory, file) + '：' + error.message)
        }
      }
    }
  }
  await visit(directory)
  const keys = documents.map((value) => document(value).sourceKey)
  if (new Set(keys).size !== keys.length) {
    throw new Error('多个Markdown文件使用了相同来源标识，请合并或修改sourceKey')
  }
  return documents
}
module.exports = { DIRECTORY, parseMarkdown, formatMarkdown, readKnowledge }
