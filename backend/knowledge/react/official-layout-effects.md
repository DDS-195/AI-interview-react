---
title: "useLayoutEffect 的测量时机"
sourceKey: "official-notes-v1:react:layout-effects:useLayoutEffect 的测量时机"
categoryId: "react"
topicIds: ["react:layout-effects"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useLayoutEffect"
sourceKind: "curated"
kind: "concept"
aliases: ["layout-effects"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## useLayoutEffect 的测量时机

**原理**：useLayoutEffect 在浏览器绘制前执行，可测量布局并修正需要立即呈现的位置。

**常见误区**：同步执行与更新会阻塞绘制；普通外部同步无需都放进布局 Effect。

**回答要点**：结合测量场景解释与 useEffect 的时机差异及性能代价。
