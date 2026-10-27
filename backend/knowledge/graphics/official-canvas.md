---
title: "Canvas 分层与重复绘制"
sourceKey: "official-notes-v1:graphics:canvas:Canvas 分层与重复绘制"
categoryId: "graphics"
topicIds: ["graphics:canvas"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas"
sourceKind: "curated"
kind: "concept"
aliases: ["canvas"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Canvas 分层与重复绘制

**原理**：频繁绘制的场景可缓存重复图形，将更新频率不同的内容分层，并避免无用绘制。

**常见误区**：每帧重建全部内容或反复缩放图像会增加成本；优化需结合真实画布尺寸和设备。

**回答要点**：说明预渲染、脏区或分层，并测量是否确实减少帧开销。
