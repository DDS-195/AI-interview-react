const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mysqlConfig } = require('../database/config')
const { transaction } = require('../database/mysql')

test('MySQL配置拒绝非法数据库名、端口和连接数，保留本机utf8mb4设置', () => {
  for (const database of ['bad-name', 'db;DROP DATABASE test', 'a'.repeat(65), '`test`']) {
    assert.throws(() => mysqlConfig({ database }), /数据库名/)
  }
  assert.throws(() => mysqlConfig({ port: 0 }), /端口/)
  assert.throws(() => mysqlConfig({ port: 'invalid' }), /端口/)
  assert.throws(() => mysqlConfig({ connectionLimit: 21 }), /连接数/)
  const config = mysqlConfig({
    database: 'learning_mysql',
    password: 'fixture-password',
    port: 3307,
    connectionLimit: 2
  })
  assert.equal(config.charset, 'utf8mb4')
  assert.equal(config.database, 'learning_mysql')
  assert.equal(config.timezone, 'Z')
})

test('事务出错先回滚并释放连接，业务冲突不重试也不返回成功', async () => {
  const trace = []
  const connection = {
    beginTransaction: async () => trace.push('begin'),
    commit: async () => trace.push('commit'),
    rollback: async () => trace.push('rollback'),
    release: () => trace.push('release')
  }
  const original = Object.assign(new Error('重复提交'), { status: 409 })
  await assert.rejects(
    transaction({ getConnection: async () => connection }, async () => {
      throw original
    }),
    (error) => error === original
  )
  assert.deepEqual(trace, ['begin', 'rollback', 'release'])
})

test('InnoDB死锁仅重试数据库事务，成功提交后释放每次借出的连接', async () => {
  const trace = []
  let attempts = 0
  const pool = {
    getConnection: async () => ({
      beginTransaction: async () => trace.push('begin'),
      commit: async () => trace.push('commit'),
      rollback: async () => trace.push('rollback'),
      release: () => trace.push('release')
    })
  }
  const result = await transaction(pool, async () => {
    if (++attempts === 1) {
      throw Object.assign(new Error('fixture-deadlock'), { code: 'ER_LOCK_DEADLOCK' })
    }
    return 'saved'
  })
  assert.equal(result, 'saved')
  assert.equal(attempts, 2)
  assert.deepEqual(trace, ['begin', 'rollback', 'release', 'begin', 'commit', 'release'])
})

test('持续死锁最多三次，回滚失败不能掩盖原来的错误', async () => {
  let released = 0
  const original = Object.assign(new Error('fixture-deadlock'), { code: 'ER_LOCK_DEADLOCK' })
  const pool = {
    getConnection: async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {
        throw new Error('fixture-rollback-failed')
      },
      release: () => released++
    })
  }
  await assert.rejects(
    transaction(pool, async () => {
      throw original
    }),
    (error) => error === original
  )
  assert.equal(released, 3)
})
