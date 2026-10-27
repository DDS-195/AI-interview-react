---
title: "effectScope 与统一释放"
sourceKey: "official-notes-v1:vue:effect-scope:effectScope 与统一释放"
categoryId: "vue"
topicIds: ["vue:effect-scope"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/api/reactivity-advanced.html"
sourceKind: "curated"
kind: "concept"
aliases: ["effect-scope"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## effectScope 与统一释放

**原理**：effectScope 收集其范围中创建的侦听和计算副作用，通过 stop 统一停止。

**常见误区**：停止作用域不等于自动清掉所有外部定时器；外部资源可注册作用域释放回调。

**回答要点**：说明范围内依赖、副作用生命周期与集中清理的收益。
