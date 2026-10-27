---
title: "Props 与组件事件的单向流动"
sourceKey: "official-notes-v1:vue:communication:Props 与组件事件的单向流动"
categoryId: "vue"
topicIds: ["vue:communication"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/components/props.html"
sourceKind: "curated"
kind: "concept"
aliases: ["communication"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Props 与组件事件的单向流动

**原理**：父组件传入 props，子组件通过事件表达修改意图，父组件决定如何更新状态。

**常见误区**：props 的对象内部仍可被修改，但隐式改变父状态会破坏清晰的数据流。

**回答要点**：明确状态归属、props 只读约定、事件负载及受控更新。
