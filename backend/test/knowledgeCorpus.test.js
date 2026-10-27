const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readKnowledge } = require('../services/knowledge/markdown')
const { document } = require('../services/knowledge/validation')
const { splitDocument } = require('../services/knowledge/chunker')
const { versionFor } = require('../services/questionPlan')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { formatMarkdown } = require('../services/knowledge/markdown')
test('知识正文可完整切片，资料版本与实际出题版本一致', async () => {
  for (const raw of await readKnowledge()) {
    const note = document(raw)
    for (const topicId of note.metadata.topicIds) {
      assert.equal(
        note.metadata.technicalVersion,
        versionFor(note.metadata.categoryId, topicId),
        raw.title
      )
    }
    const chunks = splitDocument(note.content, note.title)
    assert.ok(chunks.length > 0, raw.title)
    // 段落不得在切片中丢失；这里只验证文本，真实token上限由test:rag的完整索引验证。
    for (const paragraph of note.content
      .split(/\n\s*\n/)
      .filter((value) => !value.startsWith('#'))) {
      assert.ok(
        chunks.some((chunk) => chunk.text.includes(paragraph)),
        raw.title
      )
    }
  }
})
test('整批文件在导入前校验切片，错误定位到文件而不是写入半批后才失败', async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'interview-knowledge-'))
  const file = path.join(folder, 'broken.md')
  try {
    await fs.writeFile(
      file,
      formatMarkdown({
        title: '错误围栏',
        categoryId: 'react',
        topicIds: ['react:effects'],
        sourceUrl: 'https://react.dev/reference/react/useEffect',
        technicalVersion: versionFor('react', 'react:effects'),
        kind: 'concept',
        content: '```js\nconst n = 1'
      })
    )
    await assert.rejects(readKnowledge(folder), /broken.md：代码围栏未闭合/)
  } finally {
    await fs.unlink(file)
    await fs.rmdir(folder)
  }
})
