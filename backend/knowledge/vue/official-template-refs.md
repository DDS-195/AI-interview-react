---
title: "Vue 3.5 模板引用与挂载时机"
sourceKey: "official-notes-v1:vue:template-refs:Vue 3.5 模板引用与挂载时机"
categoryId: "vue"
topicIds: ["vue:template-refs"]
technicalVersion: "Vue 3.5+ Composition API，useTemplateRef"
sourceUrl: "https://cn.vuejs.org/guide/essentials/template-refs.html"
sourceKind: "curated"
kind: "concept"
aliases: ["template-refs"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Vue 3.5 模板引用与挂载时机

**原理**：Vue 3.5 的 useTemplateRef 对应模板 ref 名称，挂载后读取元素或组件实例。

**常见误区**：初次渲染或 v-if 移除时引用可为 null；v-for 引用数组顺序不能假定与数据一致。

**回答要点**：明确 3.5 版本，说明空值保护、DOM 使用时机及实例公开接口。
