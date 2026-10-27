---
title: "自定义指令的职责"
sourceKey: "official-notes-v1:vue:directives:自定义指令的职责"
categoryId: "vue"
topicIds: ["vue:directives"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/reusability/custom-directives.html"
sourceKind: "curated"
kind: "concept"
aliases: ["directives"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 自定义指令的职责

**原理**：指令适合复用直接操作 DOM 的行为，通过钩子处理挂载、更新与卸载。

**常见误区**：业务状态和复杂界面组织更适合组件或组合式函数；指令事件监听也需清理。

**回答要点**：说明指令绑定值、DOM 行为和释放资源，避免承担组件职责。
