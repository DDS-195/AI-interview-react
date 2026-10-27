---
title: "携带凭据的跨域响应"
sourceKey: "starter-v1:network:cors:携带凭据的跨域响应"
categoryId: "network"
topicIds: ["network:cors"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["携带凭据的跨域响应"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

携带凭据的跨域请求需要服务端允许凭据,允许来源不能使用通配符 *。credentials 配置本身不保证 Cookie 一定发送,还受 Cookie 的 SameSite 等规则约束。
