---
title: "Reducer 的纯计算与动作"
sourceKey: "official-notes-v1:react:reducer:Reducer 的纯计算与动作"
categoryId: "react"
topicIds: ["react:reducer"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useReducer"
sourceKind: "curated"
kind: "concept"
aliases: ["reducer"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Reducer 的纯计算与动作

**原理**：reducer 根据当前状态与 action 返回下一状态，集中描述复杂状态变化。

**常见误区**：reducer 内不能发请求或修改现有状态；dispatch 后当前闭包状态仍是旧快照。

**回答要点**：说明 action 语义、不可变更新与副作用的位置。
