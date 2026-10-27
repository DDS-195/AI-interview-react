---
title: "Fetch 的 HTTP 错误与取消"
sourceKey: "official-notes-v1:network:fetch:Fetch 的 HTTP 错误与取消"
categoryId: "network"
topicIds: ["network:fetch"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"
sourceKind: "curated"
kind: "concept"
aliases: ["fetch"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Fetch 的 HTTP 错误与取消

**原理**：fetch 收到 HTTP 错误状态通常仍成功返回 Response，应检查 ok 或 status，再解析正文。

**常见误区**：只有 catch 无法覆盖所有 HTTP 错误；网络完成与正文读取完成也不是同一时刻。

**回答要点**：分别处理状态错误、网络失败、解析失败与 AbortSignal 取消。
