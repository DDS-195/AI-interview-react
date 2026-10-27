---
title: "流的背压与 pipeline"
sourceKey: "official-notes-v1:nodejs:streams:流的背压与 pipeline"
categoryId: "nodejs"
topicIds: ["nodejs:streams"]
technicalVersion: "Node.js 22+"
sourceUrl: "https://nodejs.org/docs/latest-v22.x/api/stream.html"
sourceKind: "curated"
kind: "concept"
aliases: ["streams"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 流的背压与 pipeline

**原理**：Writable.write 返回 false 表示应等待 drain；pipeline 组合流并统一处理完成与错误。

**常见误区**：生产速度持续高于消费速度会积累内存；仅监听一个流的 error 不足以管理整个管道。

**回答要点**：说明分块处理、背压、取消和资源销毁。
