---
title: "provide 与 inject 的状态约定"
sourceKey: "official-notes-v1:vue:composition:provide 与 inject 的状态约定"
categoryId: "vue"
topicIds: ["vue:composition"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/components/provide-inject.html"
sourceKind: "curated"
kind: "concept"
aliases: ["composition"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## provide 与 inject 的状态约定

**原理**：祖先提供值，后代按注入键查找最近提供者；提供 ref 可保留响应式连接。

**常见误区**：注入不等于全局 store；多人随意改注入状态会让更新路径难追踪。

**回答要点**：使用 Symbol 防键冲突，将修改函数集中在提供方，需要时暴露 readonly 状态。
