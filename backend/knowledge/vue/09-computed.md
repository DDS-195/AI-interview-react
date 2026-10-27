---
title: "computed 与缓存"
sourceKey: "starter-v1:vue:computed:computed 与缓存"
categoryId: "vue"
topicIds: ["vue:computed"]
sourceUrl: "https://vuejs.org/guide/essentials/computed.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["computed 与缓存"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

computed 跟踪 getter 读取的响应式依赖,缓存计算结果;相关依赖变化时失效。普通方法调用会重新执行。Date.now 不是响应式依赖,不会自动让 computed 随时间更新。
