---
title: "SSR 缓存的作用范围"
sourceKey: "official-notes-v1:ssr:cache:SSR 缓存的作用范围"
categoryId: "ssr"
topicIds: ["ssr:cache"]
technicalVersion: "涉及Next/Nuxt时明确版本与服务端/客户端边界"
sourceUrl: "https://nextjs.org/docs/14/app/building-your-application/caching"
sourceKind: "curated"
kind: "concept"
aliases: ["cache"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## SSR 缓存的作用范围

**原理**：服务端请求复用、持久数据缓存与浏览器路由缓存具有不同作用域和生命周期。

**常见误区**：把用户私有数据当公共缓存会混淆隔离；不同 Next 版本默认缓存行为需要分别核对。

**回答要点**：先说明缓存层和失效方式；本笔记只用于通用分层原理，不套用 14 的默认值到 15。
