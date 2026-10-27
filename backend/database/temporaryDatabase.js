// 自动检查临时库命名和清理范围，测试不得删除正式业务数据库。
const path = require('node:path')
const { randomBytes } = require('node:crypto')
const mysql = require('mysql2/promise')
const { createDatabase } = require('./mysql')
const { connectionConfig, mysqlConfig } = require('./config')
const { createDataStore } = require('../services/dataStore')

async function createTemporaryDatabase(purpose = 'test') {
  if (!['test', 'quality'].includes(purpose)) {
    throw new Error('临时数据库用途无效')
  }
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true })
  const database = `ai_interview_${purpose}_${randomBytes(12).toString('hex')}`
  const productionDatabase = mysqlConfig().database
  const config = Object.freeze(await createDatabase({ database, connectionLimit: 2 }))
  const store = createDataStore(config)
  let removed = false
  return {
    store,
    config,
    close: async () => {
      if (removed) {
        return
      }
      // 只清理本函数创建的随机测试库，拒绝正式库和外部传入的名称。
      if (
        database === productionDatabase ||
        !/^ai_interview_(test|quality)_[a-f0-9]{24}$/.test(database)
      ) {
        throw new Error('临时数据库清理边界无效')
      }
      await store.close()
      const options = connectionConfig(config)
      delete options.database
      const connection = await mysql.createConnection(options)
      try {
        await connection.query(`DROP DATABASE ${mysql.escapeId(database)}`)
        removed = true
      } finally {
        await connection.end()
      }
    }
  }
}

module.exports = { createTemporaryDatabase }
