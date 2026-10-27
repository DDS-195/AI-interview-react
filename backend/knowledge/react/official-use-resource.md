---
title: "React 19 use 与资源读取"
sourceKey: "official-notes-v1:react:use-resource:React 19 use 与资源读取"
categoryId: "react"
topicIds: ["react:use-resource"]
technicalVersion: "React 19，use与Suspense；资源不得在渲染中随意重建"
sourceUrl: "https://react.dev/reference/react/use"
sourceKind: "curated"
kind: "concept"
aliases: ["use-resource"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## React 19 use 与资源读取

**原理**：use 可读取 Promise 或 Context；等待 Promise 时与 Suspense 配合，拒绝时进入错误边界。

**常见误区**：渲染时不断创建新 Promise 会破坏资源稳定性；use 只能在组件或 Hook 中使用。

**回答要点**：说明资源来源、稳定 Promise、等待和错误边界，并明确 React 19。
