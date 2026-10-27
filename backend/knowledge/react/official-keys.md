---
title: "组件状态由位置与 key 识别"
sourceKey: "official-notes-v1:react:keys:组件状态由位置与 key 识别"
categoryId: "react"
topicIds: ["react:keys"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/learn/preserving-and-resetting-state"
sourceKind: "curated"
kind: "concept"
aliases: ["keys"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 组件状态由位置与 key 识别

**原理**：React 按组件类型、树中位置和 key 区分身份；改变 key 可主动重建状态。

**常见误区**：列表下标在插入或重排时可能让状态跟着位置走；随机 key 会不断重挂载。

**回答要点**：说明稳定业务 key、状态保留与重置边界。
