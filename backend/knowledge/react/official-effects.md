---
title: "Effect 的依赖与外部同步"
sourceKey: "official-notes-v1:react:effects:Effect 的依赖与外部同步"
categoryId: "react"
topicIds: ["react:effects"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useEffect"
sourceKind: "curated"
kind: "concept"
aliases: ["effects"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Effect 的依赖与外部同步

**原理**：Effect 用于与外部系统同步，依赖项决定何时撤销旧同步并建立新同步。

**常见误区**：遗漏依赖会捕获旧值；可在渲染时计算的派生值通常不需要额外 Effect 状态。

**回答要点**：列出外部资源、依赖、清理与更新顺序，解释为何使用 Effect。
