// 数据路由负责输入输出和 HTTP 状态，持久化与统计交给 Store。
const express = require('express')
const { question, history, snapshot, text } = require('../services/dataValidation')
const { filters, reviewAction, optional } = require('../services/learningValidation')

module.exports = function createDataRouter(store) {
  const router = express.Router()
  const route = (handler) => async (req, res, next) => {
    try {
      res.json(await handler(req))
    } catch (error) {
      if (error.status) {
        res.status(error.status).json({ error: error.message })
      } else {
        next(error)
      }
    }
  }
  function pagination(req) {
    const page = Number(req.query.page || 1)
    const pageSize = Number(req.query.pageSize || 6)
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      const error = new Error('分页参数无效')
      error.status = 400
      throw error
    }
    return [page, pageSize]
  }
  function found(value) {
    if (!value) {
      const error = new Error('记录不存在或已删除')
      error.status = 404
      throw error
    }
    return value
  }
  router.get(
    '/',
    route(() => store.summary())
  )
  router.get(
    '/export',
    route(() => store.exportData())
  )
  router.get(
    '/history',
    route((req) => store.listHistory(...pagination(req)))
  )
  router.get(
    '/favorites',
    route((req) => store.listFavorites(...pagination(req)))
  )
  router.get(
    '/history/:submittedAt',
    route(async (req) => found(await store.historyDetail(req.params.submittedAt)))
  )
  router.get(
    '/questions/:id',
    route(async (req) => found(await store.getQuestion(req.params.id)))
  )
  router.get(
    '/questions',
    route((req) => store.listQuestions(filters(req.query), ...pagination(req)))
  )
  router.get(
    '/reviews',
    route((req) => store.listReviews(filters(req.query, true), ...pagination(req)))
  )
  router.get(
    '/learning',
    route((req) => store.learningOverview(optional(req.query.categoryId, '分类', 100)))
  )
  router.put(
    '/reviews/:id',
    route((req) =>
      store.markReview(text(req.params.id, '题目 ID', 200), reviewAction(req.body?.status))
    )
  )
  router.post(
    '/import',
    route((req) => store.importData(snapshot(req.body)))
  )
  router.put(
    '/questions/:id',
    route((req) => {
      const item = question(req.body)
      if (item.id !== req.params.id) {
        const error = new Error('题目 ID 不一致')
        error.status = 400
        throw error
      }
      return store.putQuestion(item)
    })
  )
  router.post(
    '/favorites/toggle',
    route((req) => store.toggleFavorite(text(req.body?.questionId, '题目 ID', 200)))
  )
  router.delete(
    '/favorites/:id',
    route((req) => store.deleteFavorite(req.params.id))
  )
  router.delete(
    '/favorites',
    route(() => store.clearFavorites())
  )
  router.post(
    '/history',
    route((req) => store.addHistory(history(req.body)))
  )
  router.delete(
    '/history/:submittedAt',
    route((req) => store.deleteHistory(req.params.submittedAt))
  )
  router.delete(
    '/history',
    route(() => store.clearHistory())
  )
  return router
}
