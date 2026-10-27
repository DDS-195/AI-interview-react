---
title: "Promise 链的错误传播"
sourceKey: "official-notes-v1:javascript:async-errors:Promise 链的错误传播"
categoryId: "javascript"
topicIds: ["javascript:async-errors"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises"
sourceKind: "curated"
kind: "concept"
aliases: ["async-errors"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Promise 链的错误传播

**原理**：链中 throw 或返回拒绝 Promise 会进入后续错误处理；返回值决定下一步接收内容。

**常见误区**：回调里启动异步操作却不 return 会形成脱离主链的任务，外层 catch 无法统一处理。

**回答要点**：说明返回 Promise、恢复结果与继续抛错三种处理方式。
