---
title: "ref 的值与解包"
sourceKey: "starter-v1:vue:ref:ref 的值与解包"
categoryId: "vue"
topicIds: ["vue:ref"]
sourceUrl: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["ref 的值与解包"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

ref 可以包装基本类型,JavaScript 中通过 .value 读写。模板常见的顶层 ref 会解包,但响应式数组或 Map 中的 ref 元素不能一概当成已自动解包。
