---
title: "模态对话框的焦点生命周期"
sourceKey: "official-notes-v1:accessibility:focus-trap:模态对话框的焦点生命周期"
categoryId: "accessibility"
topicIds: ["accessibility:focus-trap"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/"
sourceKind: "curated"
kind: "concept"
aliases: ["focus-trap"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 模态对话框的焦点生命周期

**原理**：模态打开后焦点进入对话框，Tab 保持在可操作区域，关闭后回到合理触发位置。

**常见误区**：仅加 aria-modal 不会自动实现焦点管理；被遮挡区域不应继续正常交互。

**回答要点**：说明初始焦点、Escape、循环与关闭后恢复。
