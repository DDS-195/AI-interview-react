---
title: "监听器移除与取消信号"
sourceKey: "official-notes-v1:browser:events:监听器移除与取消信号"
categoryId: "browser"
topicIds: ["browser:events"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener"
sourceKind: "curated"
kind: "concept"
aliases: ["events"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 监听器移除与取消信号

**原理**：监听器可选择捕获、只触发一次或绑定 AbortSignal，信号取消时移除相关监听。

**常见误区**：不同函数对象不是同一个监听器；移除时 capture 标记需匹配原注册。

**回答要点**：说明函数身份、传播阶段和组件卸载时释放。
