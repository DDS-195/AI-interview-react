---
title: "透传属性与多根节点"
sourceKey: "official-notes-v1:vue:attrs:透传属性与多根节点"
categoryId: "vue"
topicIds: ["vue:attrs"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/components/attrs.html"
sourceKind: "curated"
kind: "concept"
aliases: ["attrs"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 透传属性与多根节点

**原理**：未声明为 props 或 emits 的属性进入透传属性；单根组件可自动落到根节点。

**常见误区**：多根组件无法自动判断目标；包装层也可能让 class 或监听落到错误元素。

**回答要点**：说明 inheritAttrs、$attrs 和显式绑定目标，保持组件外部接口可预期。
