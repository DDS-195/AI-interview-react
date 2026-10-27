---
title: "Vite HMR 与开发构建差异"
sourceKey: "official-notes-v1:engineering:hmr:Vite HMR 与开发构建差异"
categoryId: "engineering"
topicIds: ["engineering:hmr"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://vite.dev/guide/features.html"
sourceKind: "curated"
kind: "concept"
aliases: ["hmr"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Vite HMR 与开发构建差异

**原理**：开发服务以原生模块等机制快速提供代码，并通过 HMR 更新变化模块；生产构建有独立优化流程。

**常见误区**：开发启动快不代表生产包小；热更新也不等于所有组件状态必定保留。

**回答要点**：区分开发反馈、模块更新边界与生产产物检查。
