---
title: "编译模板与运行时更新"
sourceKey: "official-notes-v1:vue:rendering:编译模板与运行时更新"
categoryId: "vue"
topicIds: ["vue:rendering"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/extras/rendering-mechanism.html"
sourceKind: "curated"
kind: "concept"
aliases: ["rendering"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 编译模板与运行时更新

**原理**：Vue 将模板编译为渲染函数，挂载创建 DOM，更新时对新旧虚拟节点进行补丁。

**常见误区**：虚拟 DOM 本身不保证所有场景更快；收益还依赖编译信息与更新范围。

**回答要点**：讲清编译、挂载、补丁三步，并说明稳定结构可减少比较工作。
