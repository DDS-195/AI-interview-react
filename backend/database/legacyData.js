// 一次性迁移读取旧 SQLite 或 JSON，不作为日常业务存储，也不改写旧文件。
const fs = require('node:fs/promises')
const path = require('node:path')
const { snapshot } = require('../services/dataValidation')
const MIGRATION_NAME = 'legacy_to_mysql_v1'

function unpack(row) {
  const { details, ...base } = row
  delete base.titleKey
  delete base.contentKey
  const result = { ...base, ...(details ? JSON.parse(details) : {}) }
  for (const key of ['score', 'correctAnswer', 'feedback']) {
    if (result[key] === null) {
      delete result[key]
    }
  }
  return result
}

async function readLegacyData(file) {
  try {
    await fs.access(file)
    if (path.extname(file) === '.json') {
      return snapshot(JSON.parse(await fs.readFile(file, 'utf8')))
    }
    if (path.extname(file) !== '.sqlite') {
      throw new Error('仅支持旧SQLite或JSON备份')
    }
    // SQLite仅用于一次性只读迁移，不参与应用的日常存储。
    const { DatabaseSync } = require('node:sqlite')
    const database = new DatabaseSync(file, { readOnly: true })
    try {
      return snapshot({
        questions: database.prepare('SELECT * FROM questions ORDER BY rowid').all().map(unpack),
        favorites: database
          .prepare('SELECT * FROM favorites ORDER BY rowid')
          .all()
          .map((row) => ({ ...row })),
        history: database
          .prepare('SELECT * FROM history ORDER BY julianday(submittedAt) DESC,rowid DESC')
          .all()
          .map(unpack)
      })
    } finally {
      database.close()
    }
  } catch (cause) {
    const error = new Error('旧数据无法读取，请检查迁移文件或从备份恢复', { cause })
    error.status = 503
    throw error
  }
}

async function migrateLegacyData(store, file, name = MIGRATION_NAME) {
  if (await store.migrationStatus(name)) {
    return { alreadyMigrated: true, counts: (await store.summary()).counts }
  }
  return store.migrateData(await readLegacyData(file), name)
}

module.exports = { readLegacyData, migrateLegacyData, MIGRATION_NAME }
