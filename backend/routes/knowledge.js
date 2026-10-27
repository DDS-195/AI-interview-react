// 知识接口只提供查看与检索，导入和索引由本机脚本显式执行。
const express = require('express')
const { text } = require('../services/dataValidation')
module.exports = function knowledgeRouter(service) {
  const router = express.Router()
  const route = (handler) => async (req, res, next) => {
    const controller = new AbortController()
    const abort = () => controller.abort()
    res.once('close', abort)
    try {
      const value = await handler(req, controller.signal)
      if (!res.destroyed) {
        res.json(value)
      }
    } catch (error) {
      if (!res.destroyed) {
        if (error.status) {
          res.status(error.status).json({ error: error.message })
        } else {
          next(error)
        }
      }
    } finally {
      res.removeListener('close', abort)
    }
  }
  router.get(
    '/status',
    route(() => service.status())
  )
  router.get(
    '/documents',
    route(() => service.repository.list())
  )
  router.get(
    '/documents/:id',
    route((req) => service.repository.detail(text(req.params.id, '知识文档', 36)))
  )
  router.post(
    '/search-preview',
    route((req, signal) => service.retrieve(req.body, { preview: true, signal }))
  )
  return router
}
