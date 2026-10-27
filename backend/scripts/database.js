// 显式执行建库或旧数据迁移，迁移备份和完成标记保护已有训练记录。
const fs = require('node:fs/promises')
const path = require('node:path')
const { isDeepStrictEqual } = require('node:util')
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true })
const { createDatabase } = require('../database/mysql')
const { createDataStore } = require('../services/dataStore')
const { readLegacyData, MIGRATION_NAME } = require('../database/legacyData')

async function main() {
  const action = process.argv[2]
  if (!['setup', 'migrate'].includes(action)) {
    throw new Error('请使用 npm run db:setup 或 npm run db:migrate')
  }
  const config = await createDatabase()
  const store = createDataStore(config)
  try {
    await store.summary()
    if (action === 'setup') {
      console.log(`MySQL数据库已就绪：${config.database}`)
      return
    }
    if (await store.migrationStatus(MIGRATION_NAME)) {
      console.log('旧数据已迁移，本次无需重复导入。')
      return
    }
    const storage = path.join(__dirname, '../storage')
    const supplied = process.argv[3]
    let source = supplied ? path.resolve(supplied) : path.join(storage, 'app-data.sqlite')
    if (!supplied) {
      try {
        await fs.access(source)
      } catch {
        source = path.join(storage, 'app-data.json')
      }
    }
    const legacy = await readLegacyData(source)
    await fs.mkdir(storage, { recursive: true })
    const backup = path.join(
      storage,
      `before-mysql-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    )
    await fs.writeFile(backup, JSON.stringify(legacy, null, 2), { flag: 'wx' })
    const before = await store.exportData()
    const result = await store.migrateData(legacy, MIGRATION_NAME)
    const after = await store.exportData()
    // 校验完整记录（包括评分、版本等），已有同ID记录以MySQL版本为准。
    for (const [collection, key] of [
      ['questions', 'id'],
      ['favorites', 'questionId'],
      ['history', 'submittedAt']
    ]) {
      const expected = new Map(legacy[collection].map((item) => [item[key], item]))
      for (const item of before[collection]) {
        expected.set(item[key], item)
      }
      const actual = new Map(after[collection].map((item) => [item[key], item]))
      for (const [id, item] of expected) {
        if (!isDeepStrictEqual(actual.get(id), item)) {
          throw new Error(`迁移完整性检查失败：${collection}`)
        }
      }
    }
    console.log(
      JSON.stringify(
        {
          database: config.database,
          migrated: !result.alreadyMigrated,
          counts: result.counts,
          backup
        },
        null,
        2
      )
    )
  } finally {
    await store.close()
  }
}

main().catch((error) => {
  console.error(`数据库操作失败：${error.code || error.message}`)
  process.exitCode = 1
})
