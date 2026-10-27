---
title: "computed 的依赖与纯计算"
sourceKey: "official-notes-v1:vue:computed:computed 的依赖与纯计算"
categoryId: "vue"
topicIds: ["vue:computed"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/essentials/computed.html"
sourceKind: "curated"
kind: "concept"
aliases: ["computed"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## computed 的依赖与纯计算

**原理**：computed 缓存依赖响应式数据的派生结果，依赖变化后才需要重新计算。

**常见误区**：Date.now 本身不是响应式依赖；getter 中发请求或改状态会混入副作用。

**回答要点**：区分缓存与方法每次调用，说明派生值应保持纯计算。
