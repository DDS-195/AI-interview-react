---
title: "IndexedDB 事务与异步时机"
sourceKey: "official-notes-v1:browser:indexeddb-transactions:IndexedDB 事务与异步时机"
categoryId: "browser"
topicIds: ["browser:indexeddb-transactions"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB"
sourceKind: "curated"
kind: "concept"
aliases: ["indexeddb-transactions"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## IndexedDB 事务与异步时机

**原理**：IndexedDB 操作在事务中异步完成，事务限定访问的 store 与读写模式。

**常见误区**：事务可能在没有待处理请求时自动结束；不要先任意 await 外部工作再复用旧事务。

**回答要点**：区分请求成功与事务整体提交，说明错误回滚和事务生命周期。
