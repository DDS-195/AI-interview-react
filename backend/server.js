// 启动时等待数据库就绪，退出时关闭 HTTP、连接池和本地模型 Worker。
require('dotenv').config({ path: __dirname + '/.env' })
const { createApp } = require('./app')
const app = createApp()
const PORT = process.env.PORT || 3001
const HOST = '127.0.0.1'

async function start() {
  try {
    await app.locals.dataStore.summary()
  } catch (error) {
    console.error(
      `MySQL初始化失败（${error.cause?.code || 'DATABASE_UNAVAILABLE'}），请检查backend/.env并执行npm run db:setup。`
    )
    await app.locals.closeDataStore().catch(() => {})
    process.exitCode = 1
    return
  }
  const server = app.listen(PORT, HOST, () => {
    console.log(`MySQL数据库已连接：${app.locals.dataStore.databaseName}`)
    console.log(`本地服务已启动 → http://${HOST}:${PORT}`)
    console.log(`健康检查 → http://${HOST}:${PORT}/api/health`)
  })
  server.on('error', (error) => {
    console.error(`本地服务启动失败：${error.message}`)
    process.exitCode = 1
    void app.locals.closeDataStore().catch(() => {})
  })
  let stopping = false
  function shutdown() {
    if (stopping) {
      return
    }
    stopping = true
    const deadline = setTimeout(() => {
      server.closeAllConnections()
      process.exit(1)
    }, 5000)
    deadline.unref()
    server.close(async () => {
      try {
        await app.locals.knowledgeService?.close()
        await app.locals.closeDataStore()
      } catch {
        process.exitCode = 1
      } finally {
        clearTimeout(deadline)
      }
    })
    server.closeIdleConnections()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

if (require.main === module) {
  void start()
}

module.exports = app
