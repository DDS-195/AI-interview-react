---
title: "异步组件的加载边界"
sourceKey: "official-notes-v1:vue:async:异步组件的加载边界"
categoryId: "vue"
topicIds: ["vue:async"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/components/async.html"
sourceKind: "curated"
kind: "concept"
aliases: ["async"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 异步组件的加载边界

**原理**：defineAsyncComponent 用加载函数延迟获取组件，可配置等待、错误组件与超时。

**常见误区**：异步加载组件并不会自动解决组件内部所有数据请求的错误。

**回答要点**：区分代码加载与业务数据加载，说明加载态、失败态及重试边界。
