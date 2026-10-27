---
title: "长选项列表与可访问导航"
sourceKey: "official-notes-v1:complex-ui:virtual-options:长选项列表与可访问导航"
categoryId: "complex-ui"
topicIds: ["complex-ui:virtual-options"]
technicalVersion: "现代浏览器；涉及编辑器库时明确库版本，不假定未给出的接口"
sourceUrl: "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/"
sourceKind: "curated"
kind: "concept"
aliases: ["virtual-options"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 长选项列表与可访问导航

**原理**：大量选项可减少同时渲染数量，但键盘活动项必须有明确焦点和可访问状态。

**常见误区**：仅保留可见 DOM 可能让方向键走到尚未挂载的项；滚动和活动项需同步。

**回答要点**：先满足组合控件键盘约定，再验证虚拟化后焦点与可见项的一致性。
