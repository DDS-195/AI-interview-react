---
title: "Profiler 的测量解读"
sourceKey: "official-notes-v1:react:profiler:Profiler 的测量解读"
categoryId: "react"
topicIds: ["react:profiler"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/Profiler"
sourceKind: "curated"
kind: "concept"
aliases: ["profiler"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Profiler 的测量解读

**原理**：Profiler 的 onRender 提供提交阶段的渲染时长等信息，用于定位实际更新成本。

**常见误区**：开发测量存在额外开销；一次渲染时长不能代表所有用户设备的交互性能。

**回答要点**：先定位重复或昂贵更新，再比较改动前后数据，结合浏览器性能工具判断。
