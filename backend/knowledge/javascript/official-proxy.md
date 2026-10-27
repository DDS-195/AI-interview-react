---
title: "Proxy 与 Reflect 的配合"
sourceKey: "official-notes-v1:javascript:proxy:Proxy 与 Reflect 的配合"
categoryId: "javascript"
topicIds: ["javascript:proxy"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy"
sourceKind: "curated"
kind: "concept"
aliases: ["proxy"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Proxy 与 Reflect 的配合

**原理**：Proxy 拦截对象基本操作，Reflect 可转发默认操作并保留 receiver 等语义。

**常见误区**：代理要遵守对象不变量；某些依赖内部槽的内建对象方法不能直接无差别代理。

**回答要点**：说明 trap、转发、receiver 与代理适用范围。
