---
title: "Portal 的事件传播路径"
sourceKey: "official-notes-v1:react:portals:Portal 的事件传播路径"
categoryId: "react"
topicIds: ["react:portals"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react-dom/createPortal"
sourceKind: "curated"
kind: "concept"
aliases: ["portals"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Portal 的事件传播路径

**原理**：Portal 将内容放到其他 DOM 容器，同时保留 React 树中的 Context 和逻辑关系。

**常见误区**：点击事件仍按 React 树传播，不能只根据 DOM 父节点推断事件处理。

**回答要点**：分别说明 DOM 放置、Context 与事件传播，解释弹窗中的冒泡处理。
