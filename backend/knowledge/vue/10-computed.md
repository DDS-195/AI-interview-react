---
title: "computed getter 的纯度"
sourceKey: "starter-v1:vue:computed:computed getter 的纯度"
categoryId: "vue"
topicIds: ["vue:computed"]
sourceUrl: "https://vuejs.org/guide/essentials/computed.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["computed getter 的纯度"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

computed getter 应只计算派生值,避免修改其他状态、发请求或操作 DOM。需要副作用时使用 watch 等机制;可写 computed 的 setter 与 getter 的职责也应区分。
