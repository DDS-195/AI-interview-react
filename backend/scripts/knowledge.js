// 日常知识操作入口：导入、索引和状态查询，服务启动不会自动导入资料。
require('dotenv').config({ path: __dirname + '/../.env', quiet: true })
const { createDataStore } = require('../services/dataStore')
const { createKnowledgeService } = require('../services/knowledge/service')
const { readKnowledge } = require('../services/knowledge/markdown')
async function main() {
  const store = createDataStore()
  const service = createKnowledgeService(store.knowledge)
  try {
    const action = process.argv[2]
    if (action === 'import') {
      let imported = 0
      for (const note of await readKnowledge()) {
        const version = await service.importDocument(note)
        if (!version.duplicate) {
          imported++
        }
      }
      console.log('Markdown资料导入：新增或更新 ' + imported + ' 条。')
    } else if (action === 'index') {
      for (let batch = 0; batch < 1000; batch++) {
        const result = await service.indexOnce()
        console.log('已处理切片：' + result.processed)
        if (!result.processed) {
          break
        }
      }
    } else if (action !== 'status') {
      throw new Error('仅支持 import、index、status')
    }
    const status = await service.status()
    console.log(JSON.stringify(status, null, 2))
    if (action === 'index' && !status.ready) {
      process.exitCode = 1
    }
  } finally {
    await service.close()
    await store.close()
  }
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
