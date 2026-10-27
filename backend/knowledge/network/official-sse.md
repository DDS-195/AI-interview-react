---
title: "SSE 的事件格式与重连"
sourceKey: "official-notes-v1:network:sse:SSE 的事件格式与重连"
categoryId: "network"
topicIds: ["network:sse"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"
sourceKind: "curated"
kind: "concept"
aliases: ["sse"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## SSE 的事件格式与重连

**原理**：SSE 使用 text/event-stream，空行分隔事件，data 多行可组成一个事件内容。

**常见误区**：网络读取的一次 chunk 不等于一个完整事件；原生 EventSource 是单向接收且请求能力有限。

**回答要点**：说明增量缓冲、事件边界、id 与重连，完成和断开应正确释放连接。
