// 装配中间件与路由，不监听端口；测试可注入临时数据源和模拟知识服务。
const express = require('express')
const rateLimit = require('express-rate-limit')
const path = require('node:path')
const { createDataStore } = require('./services/dataStore')
const compressedStatic = require('./services/compressedStatic')
const localRequests = require('./middleware/localRequests')
const { errorHandler } = require('./middleware/errors')

// 应用装配独立于监听端口，测试可注入临时数据和静态目录。
function createApp({
  dataStore = createDataStore(),
  staticDirectory = path.join(__dirname, '../ai-interview/dist'),
  knowledgeService
} = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.locals.dataStore = dataStore
  app.locals.closeDataStore = () => dataStore.close()
  app.locals.knowledgeService =
    knowledgeService ||
    (dataStore.knowledge
      ? require('./services/knowledge/service').createKnowledgeService(dataStore.knowledge)
      : null)
  app.use('/api', localRequests)
  app.use(
    '/api',
    rateLimit({
      windowMs: 60000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: '请求过于频繁，请稍后重试' }
    })
  )
  app.use(express.json({ limit: '10mb' }))
  app.use(
    '/api/ai',
    rateLimit({
      windowMs: 60000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'AI 接口请求过于频繁，请稍后重试' }
    })
  )
  app.get('/api/health', async (_req, res, next) => {
    try {
      await dataStore.summary()
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'AI前端面试助手',
        database: { type: 'mysql', name: dataStore.databaseName }
      })
    } catch (cause) {
      const error = new Error('本地数据服务未就绪', { cause })
      error.status = 503
      next(error)
    }
  })
  app.use('/api/ai', require('./routes/questions'))
  app.use('/api/ai', require('./routes/evaluation'))
  app.use('/api/data', require('./routes/data')(dataStore))
  if (app.locals.knowledgeService) {
    app.use('/api/knowledge', require('./routes/knowledge')(app.locals.knowledgeService))
  }
  app.use(compressedStatic(staticDirectory))
  app.use(express.static(staticDirectory))
  app.use((_req, res) => res.status(404).json({ error: '接口不存在' }))
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
