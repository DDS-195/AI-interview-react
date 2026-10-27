---
title: "Pinia getter 与 action 分工"
sourceKey: "official-notes-v1:vue:pinia:Pinia getter 与 action 分工"
categoryId: "vue"
topicIds: ["vue:pinia"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://pinia.vuejs.org/core-concepts/actions.html"
sourceKind: "curated"
kind: "concept"
aliases: ["pinia"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Pinia getter 与 action 分工

**原理**：action 封装业务修改与异步流程，可访问 store 状态并返回结果。

**常见误区**：把网络请求放在派生 getter 中会混入副作用；错误与加载态仍需业务明确管理。

**回答要点**：说明 action 的异步处理、错误传播与多个状态的一致更新。
