---
title: "box-sizing 与实际尺寸"
sourceKey: "official-notes-v1:html-css:box:box-sizing 与实际尺寸"
categoryId: "html-css"
topicIds: ["html-css:box"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-sizing"
sourceKind: "curated"
kind: "concept"
aliases: ["box"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## box-sizing 与实际尺寸

**原理**：content-box 的宽高描述内容盒；border-box 将内边距和边框纳入指定尺寸。

**常见误区**：margin 不在 border-box 宽度内；内容约束仍可能影响最终布局。

**回答要点**：计算内容、padding、border 和 margin，说明统一盒模型为何减少尺寸误判。
