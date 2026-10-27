---
title: "toRaw 与 markRaw 的身份风险"
sourceKey: "official-notes-v1:vue:raw:toRaw 与 markRaw 的身份风险"
categoryId: "vue"
topicIds: ["vue:raw"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/api/reactivity-advanced.html"
sourceKind: "curated"
kind: "concept"
aliases: ["raw"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## toRaw 与 markRaw 的身份风险

**原理**：toRaw 获取代理原对象；markRaw 可让指定对象跳过响应式代理转换。

**常见误区**：长期持有原对象并绕过代理修改会造成更新遗漏；嵌套对象仍可能被代理，产生身份差异。

**回答要点**：解释用于外部实例或性能场景的原因，并说明代理与原值混用的边界。
