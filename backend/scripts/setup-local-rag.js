// 串联资料准备和索引，并核对训练数据指纹；准备成功后才启用知识增强。
require('dotenv').config({ path: __dirname + '/../.env', quiet: true })
const fs = require('node:fs/promises')
const { createHash } = require('node:crypto')
const { createDataStore } = require('../services/dataStore')
const { createKnowledgeService } = require('../services/knowledge/service')
const { knowledgeConfig } = require('../services/knowledge/config')
const { readKnowledge } = require('../services/knowledge/markdown')
async function main() {
  const store = createDataStore()
  const service = createKnowledgeService(store.knowledge, {
    config: knowledgeConfig({ RAG_MODE: 'prefer' })
  })
  const fingerprint = (data) => createHash('sha256').update(JSON.stringify(data)).digest('hex')
  try {
    const before = await store.exportData()
    for (const note of await readKnowledge()) {
      await service.importDocument(note)
    }
    for (let i = 0; i < 1000; i++) {
      const result = await service.indexOnce()
      if (!result.processed) {
        break
      }
    }
    const status = await service.status()
    if (!status.ready) {
      throw new Error('部分知识未完成向量化，请再次执行knowledge:index')
    }
    if (fingerprint(before) !== fingerprint(await store.exportData())) {
      throw new Error('训练数据发生变化，停止写入知识增强配置')
    }
    const file = __dirname + '/../.env'
    let content = await fs.readFile(file, 'utf8')
    content = content.replace(/^EMBEDDING_[A-Z_]+=.*\r?\n?/gm, '')
    const settings = { RAG_MODE: 'prefer' }
    for (const [key, value] of Object.entries(settings)) {
      const line = key + '=' + value
      const pattern = new RegExp('^' + key + '=.*$', 'm')
      content = pattern.test(content)
        ? content.replace(pattern, line)
        : content.trimEnd() + '\n' + line + '\n'
    }
    await fs.writeFile(file, content, 'utf8')
    console.log(
      JSON.stringify(
        {
          enabled: true,
          model: status.model,
          documents: status.documents,
          indexed: status.indexed,
          trainingDataUnchanged: true,
          counts: (await store.summary()).counts
        },
        null,
        2
      )
    )
  } finally {
    await service.close()
    await store.close()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
