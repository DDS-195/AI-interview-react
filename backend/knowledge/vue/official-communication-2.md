---
title: "组件事件与原生冒泡的区别"
sourceKey: "official-notes-v1:vue:communication:组件事件与原生冒泡的区别"
categoryId: "vue"
topicIds: ["vue:communication"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/components/events.html"
sourceKind: "curated"
kind: "concept"
aliases: ["communication"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 组件事件与原生冒泡的区别

**原理**：组件 emit 通知直接监听它的父组件，可声明事件及参数校验。

**常见误区**：组件事件不会像 DOM 事件一样自动穿过多层组件；祖先监听需要显式转发。

**回答要点**：说明 emits 声明、事件参数、多层转发与原生事件差异。
