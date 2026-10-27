---
title: "memo 的比较与优化前提"
sourceKey: "official-notes-v1:react:memo:memo 的比较与优化前提"
categoryId: "react"
topicIds: ["react:memo"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/memo"
sourceKind: "curated"
kind: "concept"
aliases: ["memo"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## memo 的比较与优化前提

**原理**：memo 可在 props 没变时跳过父级带来的渲染，默认逐项使用 Object.is 比较。

**常见误区**：组件自己的状态与消费的 Context 改变仍会更新；每次新建对象会破坏稳定 props。

**回答要点**：先测量开销，再说明稳定引用、比较成本和 memo 的限制。
