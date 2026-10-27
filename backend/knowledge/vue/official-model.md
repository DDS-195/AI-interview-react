---
title: "组件 v-model 的基础协议"
sourceKey: "official-notes-v1:vue:model:组件 v-model 的基础协议"
categoryId: "vue"
topicIds: ["vue:model"]
technicalVersion: "Vue 3.4+ Composition API，defineModel"
sourceUrl: "https://cn.vuejs.org/guide/components/v-model.html"
sourceKind: "curated"
kind: "concept"
aliases: ["model"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 组件 v-model 的基础协议

**原理**：Vue 3 的基础协议是 modelValue prop 与 update:modelValue 事件，父组件保存值。

**常见误区**：只改子组件内部变量不会更新父组件；defineModel 是 Vue 3.4 起的语法辅助。

**回答要点**：先解释 props 与事件协议，再说明命名模型与修饰符，明确版本差异。
