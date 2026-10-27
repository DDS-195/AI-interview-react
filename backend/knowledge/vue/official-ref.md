---
title: "ref 解包的适用位置"
sourceKey: "official-notes-v1:vue:ref:ref 解包的适用位置"
categoryId: "vue"
topicIds: ["vue:ref"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html"
sourceKind: "curated"
kind: "concept"
aliases: ["ref"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## ref 解包的适用位置

**原理**：脚本通过 .value 读写 ref；模板常见顶层访问与深层 reactive 对象属性可解包。

**常见误区**：响应式数组元素与 Map 值中的 ref 不会自动解包；不能把所有位置都当成模板顶层。

**回答要点**：先说明访问位置，再判断是否需要 .value，避免混淆 ref 与普通值。
