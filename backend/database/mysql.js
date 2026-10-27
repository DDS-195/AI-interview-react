// 数据库连接与短事务基础设施；死锁重试只重做 SQL，不重做模型调用。
const mysql = require('mysql2/promise')
const fs = require('node:fs/promises')
const path = require('node:path')
const { mysqlConfig, connectionConfig } = require('./config')

async function initializeSchema(pool) {
  for (const file of ['schema.sql', 'knowledge-schema.sql']) {
    const source = await fs.readFile(path.join(__dirname, file), 'utf8')
    const statements = source
      .replace(/^\s*--.*$/gm, '')
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean)
    for (const sql of statements) {
      await pool.query(sql)
    }
  }
  // 多条DDL可能部分完成，只有全部成功才推进版本；更高版本不能被旧进程降级。
  await pool.execute(
    "INSERT INTO metadata (name,value) VALUES ('schema_version','4') ON DUPLICATE KEY UPDATE " +
      "value=IF(CAST(value AS UNSIGNED)<4,'4',value)"
  )
}

async function createDatabase(overrides = {}) {
  const config = mysqlConfig(overrides)
  const { database, ...options } = connectionConfig(config)
  const connection = await mysql.createConnection(options)
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`
    )
  } finally {
    await connection.end()
  }
  return config
}

// 每次事务只借用一个连接，提交或回滚后必定释放；仅重试可恢复的锁冲突。
async function transaction(pool, operation) {
  for (let attempt = 0; ; attempt++) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await operation(connection)
      await connection.commit()
      return result
    } catch (error) {
      try {
        await connection.rollback()
      } catch {
        /* 保留业务错误，不由回滚错误覆盖。 */
      }
      if (attempt >= 2 || !['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) {
        throw error
      }
    } finally {
      connection.release()
    }
  }
}

module.exports = {
  createPool: (options) => mysql.createPool(mysqlConfig(options)),
  initializeSchema,
  createDatabase,
  transaction
}
