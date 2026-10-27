// 普通与流式出题共用业务流程；只有校验并保存成功才发送业务完成事件。
const express = require('express')
const { validateInput } = require('../services/questionPlan')
const { generateQuestion } = require('../services/questionFlow')
const { fail } = require('../services/aiContract')
const { aiError } = require('../middleware/errors')
const router = express.Router()

function context(req) {
  const input = validateInput(req.body)
  const store = req.app.locals.dataStore
  if (!store) {
    fail('本地数据服务未就绪', 503)
  }
  return { input, store }
}

router.post('/generate-question', async (req, res) => {
  const controller = new AbortController()
  res.on('close', () => controller.abort())
  try {
    const { input, store } = context(req)
    const question = await generateQuestion(store, input, {
      signal: controller.signal,
      knowledgeService: req.app.locals.knowledgeService
    })
    if (!res.destroyed) {
      res.json({ ...question, category: question.categoryId })
    }
  } catch (error) {
    const failure = aiError(error, 'AI 服务调用失败，请检查连接或额度后重试')
    if (!res.destroyed) {
      res.status(failure.status).json({ error: failure.message })
    }
  }
})

router.post('/generate-question-stream', async (req, res) => {
  let requestContext
  try {
    requestContext = context(req)
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message })
  }
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const controller = new AbortController()
  res.on('close', () => controller.abort())
  const send = (value) => {
    if (!res.destroyed && !res.writableEnded) {
      res.write('data: ' + JSON.stringify(value) + '\n\n')
    }
  }
  try {
    const question = await generateQuestion(requestContext.store, requestContext.input, {
      stream: true,
      knowledgeService: req.app.locals.knowledgeService,
      signal: controller.signal,
      onPreview: (fullContent) => send({ content: '', fullContent })
    })
    send({
      done: true,
      title: question.title,
      body: question.content,
      difficulty: question.difficulty,
      topic: question.topic,
      question
    })
  } catch (error) {
    if (!controller.signal.aborted) {
      send({ error: aiError(error, '题目生成失败，请检查连接或额度后重试').message })
    }
  } finally {
    if (!res.writableEnded) {
      res.end()
    }
  }
})

module.exports = router
