---
title: "Context 的读取与更新范围"
sourceKey: "official-notes-v1:react:context:Context 的读取与更新范围"
categoryId: "react"
topicIds: ["react:context"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useContext"
sourceKind: "curated"
kind: "concept"
aliases: ["context"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Context 的读取与更新范围

**原理**：useContext 读取上方最近 Provider 的值，Provider 值变化会通知相关消费者。

**常见误区**：memo 不会阻止已消费的 Context 更新；无意义地新建 value 对象会扩大更新。

**回答要点**：区分状态归属与传递方式，按更新频率拆分 Context 并保持值语义稳定。
