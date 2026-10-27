---
title: "自定义 Hook 共享逻辑"
sourceKey: "official-notes-v1:react:custom-hooks:自定义 Hook 共享逻辑"
categoryId: "react"
topicIds: ["react:custom-hooks"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/learn/reusing-logic-with-custom-hooks"
sourceKind: "curated"
kind: "concept"
aliases: ["custom-hooks"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 自定义 Hook 共享逻辑

**原理**：自定义 Hook 组合其他 Hook 复用状态逻辑，每次调用拥有自身状态实例。

**常见误区**：复用 Hook 不等于自动共享同一个状态；条件调用会破坏 Hook 调用顺序。

**回答要点**：说明 Hook 输入输出、独立状态与副作用清理，真正共享状态时使用上层状态或 store。
