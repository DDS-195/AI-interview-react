// 按知识边界保留段落和完整代码；字符预算不能替代真实 tokenizer 检查。
const { hash, fail } = require('./validation')
const CHUNKING_VERSION = 'semantic-v1'
// 以标题、段落及完整代码围栏为边界；估计长度只用于控制成本，不冒充模型token数。
function splitDocument(content, title, maxChars = 1800) {
  const blocks = []
  const lines = content.split('\n')
  let paragraph = []
  let fence = ''
  let headings = [title]
  function flush() {
    if (paragraph.length) {
      blocks.push({ text: paragraph.join('\n').trim(), headingPath: headings.join(' / ') })
    }
    paragraph = []
  }
  for (const line of lines) {
    const delimiter = line.match(/^\s*(```+|~~~+)/)?.[1]
    if (delimiter) {
      if (!fence) {
        flush()
        fence = delimiter[0]
      } else if (delimiter[0] === fence) {
        paragraph.push(line)
        fence = ''
        flush()
        continue
      }
    }
    const heading = !fence && line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flush()
      headings = [...headings.slice(0, heading[1].length), heading[2]]
      paragraph.push(line)
    } else if (!fence && !line.trim()) {
      flush()
    } else {
      paragraph.push(line)
    }
  }
  if (fence) {
    fail('代码围栏未闭合，请修正知识正文')
  }
  flush()
  const chunks = []
  for (const block of blocks.filter((block) => block.text)) {
    if (block.headingPath.length > 500) {
      fail('章节标题路径过长，请缩短标题')
    }
    if (block.text.length > 6000) {
      fail('知识段落或代码片段过长，请按完整知识单元拆分')
    }
    const last = chunks.at(-1)
    if (
      last &&
      last.headingPath === block.headingPath &&
      last.text.length + block.text.length + 2 <= maxChars
    ) {
      last.text += '\n\n' + block.text
    } else {
      chunks.push({ ...block })
    }
  }
  if (!chunks.length || chunks.length > 100) {
    fail('切片数量无效')
  }
  return chunks.map((chunk, sequence) => ({ ...chunk, sequence, contentHash: hash(chunk.text) }))
}
module.exports = { splitDocument, CHUNKING_VERSION }
