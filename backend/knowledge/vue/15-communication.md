---
title: "Props 的单向数据流"
sourceKey: "starter-v1:vue:communication:Props 的单向数据流"
categoryId: "vue"
topicIds: ["vue:communication"]
sourceUrl: "https://vuejs.org/guide/components/props.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Vue 3 Composition API"
aliases: ["Props 的单向数据流"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

Props 由父组件向子组件传递,子组件不应直接改写 prop 绑定。对象的嵌套属性技术上仍可能被修改,但会让父子状态耦合;通常通过事件通知父组件更新。
