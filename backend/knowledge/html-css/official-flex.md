---
title: "Flex 的主轴与尺寸分配"
sourceKey: "official-notes-v1:html-css:flex:Flex 的主轴与尺寸分配"
categoryId: "html-css"
topicIds: ["html-css:flex"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox"
sourceKind: "curated"
kind: "concept"
aliases: ["flex"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Flex 的主轴与尺寸分配

**原理**：Flex 是一维布局，主轴由 flex-direction 决定，剩余空间按伸缩规则分配。

**常见误区**：justify-content 不总是水平对齐；内容的最小尺寸约束可能阻止项目收缩。

**回答要点**：说明主轴、交叉轴与 grow、shrink、basis 的分工。
