---
title: "KeepAlive 的激活与卸载"
sourceKey: "official-notes-v1:vue:cache:KeepAlive 的激活与卸载"
categoryId: "vue"
topicIds: ["vue:cache"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/guide/built-ins/keep-alive.html"
sourceKind: "curated"
kind: "concept"
aliases: ["cache"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## KeepAlive 的激活与卸载

**原理**：KeepAlive 缓存组件实例及状态，切换时使用 activated 和 deactivated 生命周期。

**常见误区**：进入缓存通常是停用而不是卸载；仅在 unmounted 清理可能让隐藏组件继续工作。

**回答要点**：说明 include、exclude、max 以及停用时暂停订阅或轮询的策略。
