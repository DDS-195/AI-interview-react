---
title: "pipeline 的错误与结束管理"
sourceKey: "starter-v1:nodejs:streams:pipeline 的错误与结束管理"
categoryId: "nodejs"
topicIds: ["nodejs:streams"]
sourceUrl: "https://nodejs.org/docs/latest-v22.x/api/stream.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Node.js 22+"
aliases: ["pipeline 的错误与结束管理"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

pipeline 连接多个流并协同管理结束与错误,Promise 版本可以 await 并捕获失败。应用仍需考虑资源边界与取消,不能把创建可读流等同于数据已完整持久化。
