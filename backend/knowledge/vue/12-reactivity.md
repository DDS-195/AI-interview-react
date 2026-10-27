---
title: "reactive 与解构边界"
sourceKey: "starter-v1:vue:reactivity:reactive 与解构边界"
categoryId: "vue"
topicIds: ["vue:reactivity"]
sourceUrl: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["reactive 与解构边界"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

Vue 3 用 Proxy 代理对象读写以建立响应式关联。把 reactive 对象的基本类型属性直接解构到普通变量会断开该变量的响应式关联;不是所有解构结果都自动保持响应式。
