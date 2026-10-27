---
title: "缓存验证与重新下载"
sourceKey: "official-notes-v1:network:cache:缓存验证与重新下载"
categoryId: "network"
topicIds: ["network:cache"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching"
sourceKind: "curated"
kind: "concept"
aliases: ["cache"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 缓存验证与重新下载

**原理**：过期或需验证的缓存可以发送条件请求，资源未变化时服务端返回 304 以复用已存正文。

**常见误区**：no-cache 要求复用前验证，no-store 才是不保存；304 不携带新完整正文。

**回答要点**：区分新鲜度、验证器、条件请求和缓存存储策略。
