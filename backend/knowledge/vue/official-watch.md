---
title: "watch 与 watchEffect 的依赖边界"
sourceKey: "official-notes-v1:vue:watch:watch 与 watchEffect 的依赖边界"
categoryId: "vue"
topicIds: ["vue:watch"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/essentials/watchers.html"
sourceKind: "curated"
kind: "concept"
aliases: ["watch"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## watch 与 watchEffect 的依赖边界

**原理**：watch 显式指定来源；watchEffect 自动收集同步执行期间读取的响应式依赖。

**常见误区**：异步 watchEffect 中 await 之后的读取不自动计入；深度监听不等于保存旧对象副本。

**回答要点**：说明监听来源、即时执行、深度遍历成本与异步竞态清理。
