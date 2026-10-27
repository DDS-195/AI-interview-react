---
title: "Grid 的轨道与二维布局"
sourceKey: "official-notes-v1:html-css:grid:Grid 的轨道与二维布局"
categoryId: "html-css"
topicIds: ["html-css:grid"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids"
sourceKind: "curated"
kind: "concept"
aliases: ["grid"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Grid 的轨道与二维布局

**原理**：Grid 同时控制行列，轨道定义与项目放置共同决定二维布局。

**常见误区**：fr 分配剩余空间，内容最小尺寸仍可能撑开轨道；不是任意情况下的固定百分比。

**回答要点**：说明轨道、间距、放置与 minmax 的尺寸边界。
