---
title: "Express 异步错误的版本差异"
sourceKey: "official-notes-v1:nodejs:errors:Express 异步错误的版本差异"
categoryId: "nodejs"
topicIds: ["nodejs:errors"]
technicalVersion: "Node.js 22+"
sourceUrl: "https://expressjs.com/en/guide/error-handling/"
sourceKind: "curated"
kind: "concept"
aliases: ["errors"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Express 异步错误的版本差异

**原理**：错误中间件使用四个参数；Express 5 对返回 Promise 的拒绝自动转交错误流程。

**常见误区**：Express 4 不能直接假定同样行为；响应头已发出后不能再重复写一个 JSON 错误体。

**回答要点**：明确版本，说明 next(error)、统一边界与流式响应已开始时的处理。
