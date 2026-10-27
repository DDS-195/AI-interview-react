---
title: "Pinia 状态与解构响应式"
sourceKey: "official-notes-v1:vue:pinia:Pinia 状态与解构响应式"
categoryId: "vue"
topicIds: ["vue:pinia"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://pinia.vuejs.org/core-concepts/state.html"
sourceKind: "curated"
kind: "concept"
aliases: ["pinia"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Pinia 状态与解构响应式

**原理**：store 中 state 保存状态，可直接更新或通过 $patch 组织更新。

**常见误区**：直接解构 store 的状态会失去响应式访问连接；保留 store 引用或使用 storeToRefs。

**回答要点**：区分状态、派生值与动作，说明重置和修改路径。
