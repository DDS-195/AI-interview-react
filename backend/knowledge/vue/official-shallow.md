---
title: "shallowRef 的浅层响应"
sourceKey: "official-notes-v1:vue:shallow:shallowRef 的浅层响应"
categoryId: "vue"
topicIds: ["vue:shallow"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/api/reactivity-advanced.html"
sourceKind: "curated"
kind: "concept"
aliases: ["shallow"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## shallowRef 的浅层响应

**原理**：shallowRef 只跟踪 .value 替换，内部对象保持原样，适合大型不可变数据或外部状态。

**常见误区**：修改深层属性不会自动触发依赖更新；可以替换整体或按需 triggerRef。

**回答要点**：说明浅层边界、更新约定以及与普通 ref 深层转换的区别。
