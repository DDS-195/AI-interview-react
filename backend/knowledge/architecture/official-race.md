---
title: "异步结果过期与 AbortController"
sourceKey: "official-notes-v1:architecture:race:异步结果过期与 AbortController"
categoryId: "architecture"
topicIds: ["architecture:race"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/AbortController"
sourceKind: "curated"
kind: "concept"
aliases: ["race"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 异步结果过期与 AbortController

**原理**：AbortController 可通知支持信号的操作取消，界面切换时应中止过期请求并保护最终更新。

**常见误区**：取消信号不保证服务端从未执行请求；已完成的结果也需按请求身份判断是否仍有效。

**回答要点**：区分取消、过期结果忽略与资源释放，避免旧请求覆盖新选择。
