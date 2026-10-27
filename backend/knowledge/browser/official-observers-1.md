---
title: "IntersectionObserver 的可见性阈值"
sourceKey: "official-notes-v1:browser:observers:IntersectionObserver 的可见性阈值"
categoryId: "browser"
topicIds: ["browser:observers"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"
sourceKind: "curated"
kind: "concept"
aliases: ["observers"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## IntersectionObserver 的可见性阈值

**原理**：观察目标与根区域的交叉比例，异步通知越过阈值的变化，适合懒加载与无限滚动。

**常见误区**：交叉不保证元素完全无遮挡或用户真正看见；加载后应停止无用观察。

**回答要点**：说明 root、rootMargin、threshold 与取消观察。
