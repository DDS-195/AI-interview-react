---
title: "CORS 预检与凭据请求"
sourceKey: "official-notes-v1:network:cors:CORS 预检与凭据请求"
categoryId: "network"
topicIds: ["network:cors"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
sourceKind: "curated"
kind: "concept"
aliases: ["cors"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## CORS 预检与凭据请求

**原理**：浏览器根据方法与头部等条件决定是否预检，服务端允许来源、方法和头部。

**常见误区**：携带凭据时不能用通配来源代替明确来源；CORS 不等于服务端身份鉴权。

**回答要点**：说明同源策略、预检缓存、凭据与响应头的对应关系。
