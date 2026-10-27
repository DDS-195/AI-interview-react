---
title: "验证缓存与 304"
sourceKey: "starter-v1:network:cache:验证缓存与 304"
categoryId: "network"
topicIds: ["network:cache"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["验证缓存与 304"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

缓存过期后可以用 ETag/If-None-Match 等验证器请求验证。资源未变化时 304 允许复用已保存的响应体;304 不是服务端重新发送完整响应体。
