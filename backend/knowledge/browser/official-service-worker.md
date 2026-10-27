---
title: "Service Worker 的缓存更新生命周期"
sourceKey: "official-notes-v1:browser:service-worker:Service Worker 的缓存更新生命周期"
categoryId: "browser"
topicIds: ["browser:service-worker"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers"
sourceKind: "curated"
kind: "concept"
aliases: ["service-worker"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Service Worker 的缓存更新生命周期

**原理**：Service Worker 经注册、安装和激活后拦截受控范围请求，可实现离线响应。

**常见误区**：新 worker 安装后不一定立刻控制旧页面；过期缓存需在激活阶段有计划清理。

**回答要点**：说明作用域、生命周期与版本缓存，区分首次访问和已受控页面。
