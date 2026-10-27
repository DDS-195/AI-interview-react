---
title: "移动端视口与缩放"
sourceKey: "official-notes-v1:mobile:viewport:移动端视口与缩放"
categoryId: "mobile"
topicIds: ["mobile:viewport"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport"
sourceKind: "curated"
kind: "concept"
aliases: ["viewport"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 移动端视口与缩放

**原理**：viewport 元信息影响布局视口与初始缩放，常见配置使用设备宽度与合理初始比例。

**常见误区**：固定桌面宽度会让移动布局被缩小；禁止用户缩放可能损害可访问性。

**回答要点**：区分布局尺寸、设备像素与缩放，结合响应式断点解释。
