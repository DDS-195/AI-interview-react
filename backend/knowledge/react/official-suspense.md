---
title: "Suspense 的支持范围"
sourceKey: "official-notes-v1:react:suspense:Suspense 的支持范围"
categoryId: "react"
topicIds: ["react:suspense"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/Suspense"
sourceKind: "curated"
kind: "concept"
aliases: ["suspense"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Suspense 的支持范围

**原理**：Suspense 在支持挂起的子树等待时展示 fallback，常见入口是 lazy 组件和支持的框架数据层。

**常见误区**：普通 useEffect 中 fetch 不会自动触发 Suspense；任意 Promise 也不会天然接入边界。

**回答要点**：说明边界位置、加载体验与数据源必须满足的支持条件。
