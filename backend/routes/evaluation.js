// 评分 HTTP 入口只连接请求生命周期与业务流程，不在路由内组装 Prompt。
const express = require('express')
const { evaluateAnswer } = require('../services/evaluationFlow')
const { aiError } = require('../middleware/errors')
const router = express.Router()

router.post('/evaluate-answer', async (req, res) => {
  const controller = new AbortController()
  res.on('close', () => controller.abort())
  try {
    const result = await evaluateAnswer(req.app.locals.dataStore, req.body, controller.signal)
    if (!res.destroyed) {
      res.json(result)
    }
  } catch (error) {
    const failure = aiError(error, '评估失败，请检查连接或额度后重试')
    if (!res.destroyed) {
      res.status(failure.status).json({ error: failure.message })
    }
  }
})
module.exports = router
