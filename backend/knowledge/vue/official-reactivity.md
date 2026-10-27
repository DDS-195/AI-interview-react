---
title: "Vue 响应式与代理身份"
sourceKey: "official-notes-v1:vue:reactivity:Vue 响应式与代理身份"
categoryId: "vue"
topicIds: ["vue:reactivity"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html"
sourceKind: "curated"
kind: "concept"
aliases: ["reactivity"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Vue 响应式与代理身份

**原理**：reactive 返回对象代理，通过属性读写参与依赖跟踪；代理与原对象身份不同。

**常见误区**：直接修改原对象不会经过代理；替换整个 reactive 变量也会丢失旧引用的连接。

**回答要点**：说明 Proxy 拦截、依赖追踪与触发更新，并区分原对象、代理和引用身份。
