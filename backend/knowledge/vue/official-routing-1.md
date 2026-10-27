---
title: "路由参数变化与组件复用"
sourceKey: "official-notes-v1:vue:routing:路由参数变化与组件复用"
categoryId: "vue"
topicIds: ["vue:routing"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://router.vuejs.org/guide/essentials/dynamic-matching.html"
sourceKind: "curated"
kind: "concept"
aliases: ["routing"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 路由参数变化与组件复用

**原理**：同一路由模式仅参数改变时，路由组件实例可能复用，应监听参数或使用更新守卫加载数据。

**常见误区**：只在 mounted 请求一次可能显示旧用户资料；请求完成顺序也可能与导航顺序不同。

**回答要点**：说明参数响应、加载触发与旧请求取消，区分复用和重新挂载。
