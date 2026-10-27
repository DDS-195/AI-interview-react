---
title: "Transition 的优先级边界"
sourceKey: "official-notes-v1:react:transitions:Transition 的优先级边界"
categoryId: "react"
topicIds: ["react:transitions"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useTransition"
sourceKind: "curated"
kind: "concept"
aliases: ["transitions"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Transition 的优先级边界

**原理**：Transition 将某些状态更新标为可被更紧急交互打断的更新，帮助保持输入响应。

**常见误区**：不能用 Transition 状态直接控制文本输入；它不会让昂贵函数自动移到后台线程。

**回答要点**：区分紧急输入与较慢结果更新，说明 pending 与可中断渲染。
