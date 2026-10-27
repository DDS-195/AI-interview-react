---
title: "生命周期钩子的注册与清理"
sourceKey: "official-notes-v1:vue:lifecycle:生命周期钩子的注册与清理"
categoryId: "vue"
topicIds: ["vue:lifecycle"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/essentials/lifecycle.html"
sourceKind: "curated"
kind: "concept"
aliases: ["lifecycle"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 生命周期钩子的注册与清理

**原理**：在 setup 同步执行期间注册生命周期钩子，挂载后可访问已创建的 DOM。

**常见误区**：在延迟回调里注册钩子可能无法关联当前组件；定时器和外部监听需主动清理。

**回答要点**：区分挂载、更新与卸载，解释副作用的创建位置与释放位置。
