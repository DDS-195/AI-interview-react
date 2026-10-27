---
title: "watch 与 watchEffect"
sourceKey: "starter-v1:vue:watch:watch 与 watchEffect"
categoryId: "vue"
topicIds: ["vue:watch"]
sourceUrl: "https://vuejs.org/guide/essentials/watchers.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["watch 与 watchEffect"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

watch 显式声明监听源,回调使用的其他值不会自动成为源;watchEffect 自动跟踪同步执行期间读取的响应式值。异步回调在首个 await 之后读取的值不自动纳入 watchEffect 依赖。
