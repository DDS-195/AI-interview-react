---
title: "React 19 的 ref prop"
sourceKey: "official-notes-v1:react:ref-prop:React 19 的 ref prop"
categoryId: "react"
topicIds: ["react:ref-prop"]
technicalVersion: "React 19，ref作为prop与ref回调清理"
sourceUrl: "https://react.dev/blog/2024/12/05/react-19"
sourceKind: "curated"
kind: "concept"
aliases: ["ref-prop"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## React 19 的 ref prop

**原理**：React 19 函数组件可以从 props 接收 ref，减少新代码对 forwardRef 的需要。

**常见误区**：React 18 的普通函数组件不能直接沿用该写法；迁移前须核对运行版本。

**回答要点**：区分两代版本的 ref 传递接口，保留组件所需的最小公开能力。
