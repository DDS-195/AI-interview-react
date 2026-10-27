---
title: "Partial 与 Pick 的边界"
sourceKey: "official-notes-v1:typescript:utilities:Partial 与 Pick 的边界"
categoryId: "typescript"
topicIds: ["typescript:utilities"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/utility-types.html"
sourceKind: "curated"
kind: "concept"
aliases: ["utilities"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Partial 与 Pick 的边界

**原理**：Partial 将第一层属性变为可选，Pick 按键保留属性，Omit 排除指定键。

**常见误区**：Partial 并非深度可选；类型工具不会验证接口响应，也不会生成新对象。

**回答要点**：说明适用层级和键约束，将运行时校验与类型描述分开。
