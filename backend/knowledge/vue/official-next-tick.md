---
title: "nextTick 与 DOM 更新批次"
sourceKey: "official-notes-v1:vue:next-tick:nextTick 与 DOM 更新批次"
categoryId: "vue"
topicIds: ["vue:next-tick"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/essentials/reactivity-fundamentals.html"
sourceKind: "curated"
kind: "concept"
aliases: ["next-tick"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## nextTick 与 DOM 更新批次

**原理**：响应式状态变更立即可读，Vue 将相关 DOM 更新合并；nextTick 等待这轮更新完成。

**常见误区**：状态已变不代表 DOM 已更新；nextTick 也不是等待图片加载或网络完成的工具。

**回答要点**：区分状态、DOM 更新和外部异步任务，再解释测量 DOM 的时机。
