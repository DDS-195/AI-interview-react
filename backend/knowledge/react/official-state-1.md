---
title: "状态快照与函数式更新"
sourceKey: "official-notes-v1:react:state:状态快照与函数式更新"
categoryId: "react"
topicIds: ["react:state"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/learn/queueing-a-series-of-state-updates"
sourceKind: "curated"
kind: "concept"
aliases: ["state"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 状态快照与函数式更新

**原理**：一次渲染读取固定状态快照；连续依赖旧值的更新可使用 updater 函数依次处理。

**常见误区**：多次 setCount(count + 1) 读取同一快照，不能假定每次都累加。

**回答要点**：说明批处理、快照与更新队列，区分替换值和 updater。
