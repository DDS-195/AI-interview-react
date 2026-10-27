---
title: "History 状态与导航事件"
sourceKey: "official-notes-v1:browser:history:History 状态与导航事件"
categoryId: "browser"
topicIds: ["browser:history"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API"
sourceKind: "curated"
kind: "concept"
aliases: ["history"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## History 状态与导航事件

**原理**：pushState 添加历史项，replaceState 替换当前项；前进后退可通过 popstate 恢复界面。

**常见误区**：直接调用 pushState 不会自行触发 popstate；刷新深层路径还需要服务端路由支持。

**回答要点**：说明 URL、历史 state 和界面状态如何同步。
