---
title: "导航守卫的权限与返回值"
sourceKey: "official-notes-v1:vue:routing:导航守卫的权限与返回值"
categoryId: "vue"
topicIds: ["vue:routing"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://router.vuejs.org/guide/advanced/navigation-guards.html"
sourceKind: "curated"
kind: "concept"
aliases: ["routing"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 导航守卫的权限与返回值

**原理**：守卫可以取消、重定向或等待异步检查，流程需有明确结束结果。

**常见误区**：重复调用旧式 next 或重定向到同一受限页可能导致异常；前端守卫不能替代服务端鉴权。

**回答要点**：说明守卫执行阶段、登录状态判断和重定向循环处理。
