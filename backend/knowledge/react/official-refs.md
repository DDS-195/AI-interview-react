---
title: "ref 保存值与渲染状态"
sourceKey: "official-notes-v1:react:refs:ref 保存值与渲染状态"
categoryId: "react"
topicIds: ["react:refs"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useRef"
sourceKind: "curated"
kind: "concept"
aliases: ["refs"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## ref 保存值与渲染状态

**原理**：ref 对象跨渲染保持稳定，修改 current 不触发界面重新渲染，可保存 DOM 或计时器。

**常见误区**：需要显示在界面的值只放在 ref 中会导致界面不更新；渲染期间随意读写破坏纯计算。

**回答要点**：按值是否影响渲染选择 state 或 ref，说明生命周期内的使用位置。
