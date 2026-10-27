---
title: "外部 store 的快照约定"
sourceKey: "official-notes-v1:react:external-store:外部 store 的快照约定"
categoryId: "react"
topicIds: ["react:external-store"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useSyncExternalStore"
sourceKind: "curated"
kind: "concept"
aliases: ["external-store"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 外部 store 的快照约定

**原理**：useSyncExternalStore 通过 subscribe 与 getSnapshot 读取 React 外部状态，并接收变更。

**常见误区**：未变化时 getSnapshot 应返回缓存的同一快照；每次创建新对象可造成反复更新。

**回答要点**：说明订阅释放、快照稳定性及 SSR 所需的 getServerSnapshot。
