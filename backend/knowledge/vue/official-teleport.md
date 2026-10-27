---
title: "Teleport 的 DOM 与组件关系"
sourceKey: "official-notes-v1:vue:teleport:Teleport 的 DOM 与组件关系"
categoryId: "vue"
topicIds: ["vue:teleport"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/built-ins/teleport.html"
sourceKind: "curated"
kind: "concept"
aliases: ["teleport"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Teleport 的 DOM 与组件关系

**原理**：Teleport 改变实际 DOM 挂载位置，组件逻辑层级、props 和注入关系保持原样。

**常见误区**：弹窗移到 body 不代表逻辑上脱离父组件；目标容器须在正确时机存在。

**回答要点**：区分 DOM 树与组件树，解释弹窗定位、层叠和目标容器管理。
