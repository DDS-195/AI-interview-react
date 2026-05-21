require('dotenv').config({ path: __dirname + '/.env' })
const express = require('express')
const rateLimit = require('express-rate-limit')

const questionRoutes = require('./routes/questions')
const evaluationRoutes = require('./routes/evaluation')

const app = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后重试' }
})
app.use(globalLimiter)

// AI 接口更严格的速率限制
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI 接口请求过于频繁，请稍后重试' }
})
app.use('/api/ai', aiLimiter)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'AI Interview Backend' })
})

// API 路由
app.use('/api/ai', questionRoutes)
app.use('/api/ai', evaluationRoutes)

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误', message: process.env.NODE_ENV === 'development' ? err.message : '服务暂不可用' })
})

// 404
app.use((req, res) => {
  console.warn(`404: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ error: '接口不存在' })
})

app.listen(PORT, () => {
  console.log(`后端服务已启动 → http://localhost:${PORT}`)
  console.log(`健康检查 → http://localhost:${PORT}/api/health`)
})
