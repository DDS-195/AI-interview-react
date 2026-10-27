---
title: "对象状态的不可变更新"
sourceKey: "official-notes-v1:react:state:对象状态的不可变更新"
categoryId: "react"
topicIds: ["react:state"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/learn/updating-objects-in-state"
sourceKind: "curated"
kind: "concept"
aliases: ["state"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 对象状态的不可变更新

**原理**：修改对象状态时创建新对象，并为变化的嵌套层建立新引用。

**常见误区**：直接改现有对象后传回同一引用可能跳过更新；展开运算符只做浅复制。

**回答要点**：指出变化路径，解释浅复制和结构共享，避免无必要的全量深复制。
