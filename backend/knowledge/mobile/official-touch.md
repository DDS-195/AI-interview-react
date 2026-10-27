---
title: "touch-action 与浏览器手势"
sourceKey: "official-notes-v1:mobile:touch:touch-action 与浏览器手势"
categoryId: "mobile"
topicIds: ["mobile:touch"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action"
sourceKind: "curated"
kind: "concept"
aliases: ["touch"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## touch-action 与浏览器手势

**原理**：touch-action 声明触摸交互允许的浏览器默认平移或缩放行为，便于处理自定义手势。

**常见误区**：全面禁用默认手势可能破坏正常滚动与缩放；浏览器接管手势后可触发 pointercancel。

**回答要点**：说明允许的滚动方向、手势冲突和取消处理。
