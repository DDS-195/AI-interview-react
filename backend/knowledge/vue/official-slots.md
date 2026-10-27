---
title: "插槽内容的作用域"
sourceKey: "official-notes-v1:vue:slots:插槽内容的作用域"
categoryId: "vue"
topicIds: ["vue:slots"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/components/slots.html"
sourceKind: "curated"
kind: "concept"
aliases: ["slots"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 插槽内容的作用域

**原理**：父级提供的插槽内容通常访问父级作用域；子级通过插槽 props 向内容传数据。

**常见误区**：不能默认在父级插槽模板里直接读取子组件内部状态。

**回答要点**：区分默认、具名与作用域插槽，说明数据由谁提供、模板由谁编写。
