---
title: "DOM 更新与 nextTick"
sourceKey: "starter-v1:vue:next-tick:DOM 更新与 nextTick"
categoryId: "vue"
topicIds: ["vue:next-tick"]
sourceUrl: "https://vuejs.org/guide/essentials/reactivity-fundamentals.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["DOM 更新与 nextTick"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

Vue 对响应式状态触发的 DOM 更新进行缓冲批处理,状态写入后 DOM 未必立即变化。await nextTick 可以等待这轮 DOM 更新完成,不能把它当作任意网络请求完成的保证。
