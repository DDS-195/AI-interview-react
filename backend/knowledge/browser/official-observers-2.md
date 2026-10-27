---
title: "ResizeObserver 与布局循环"
sourceKey: "official-notes-v1:browser:observers:ResizeObserver 与布局循环"
categoryId: "browser"
topicIds: ["browser:observers"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver"
sourceKind: "curated"
kind: "concept"
aliases: ["observers"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## ResizeObserver 与布局循环

**原理**：ResizeObserver 观察元素内容盒或边框盒尺寸变化，不只依赖窗口 resize。

**常见误区**：回调里反复改变被观察尺寸可能造成循环与延迟通知；卸载后需断开观察。

**回答要点**：区分窗口变化和元素变化，说明测量、更新及反馈循环控制。
