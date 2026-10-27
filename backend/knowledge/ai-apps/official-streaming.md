---
title: "AI 流式输出的事件边界"
sourceKey: "official-notes-v1:ai-apps:streaming:AI 流式输出的事件边界"
categoryId: "ai-apps"
topicIds: ["ai-apps:streaming"]
technicalVersion: "通用LLM应用；模型与协议版本在题干中明确，不假定供应商专有API"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"
sourceKind: "curated"
kind: "concept"
aliases: ["streaming"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## AI 流式输出的事件边界

**原理**：AI 流式接口可使用 SSE 传输增量事件，接收方缓冲后按完整事件处理数据。

**常见误区**：底层数据块可能截断文本或事件；部分 JSON 不应直接当完整业务结果保存。

**回答要点**：说明文本解码、事件累积、完成事件、取消与断线错误。
