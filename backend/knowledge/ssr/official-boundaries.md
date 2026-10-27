---
title: "服务端组件与客户端边界"
sourceKey: "official-notes-v1:ssr:boundaries:服务端组件与客户端边界"
categoryId: "ssr"
topicIds: ["ssr:boundaries"]
technicalVersion: "涉及Next/Nuxt时明确版本与服务端/客户端边界"
sourceUrl: "https://nextjs.org/docs/14/app/building-your-application/rendering/server-components"
sourceKind: "curated"
kind: "concept"
aliases: ["boundaries"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 服务端组件与客户端边界

**原理**：服务端组件在服务端执行，交互状态与浏览器 API 放在客户端组件边界中。

**常见误区**：use client 定义模块边界，不等于整页失去服务端渲染；跨边界数据需满足序列化要求。

**回答要点**：说明服务端数据读取、客户端交互与传递数据的限制。
