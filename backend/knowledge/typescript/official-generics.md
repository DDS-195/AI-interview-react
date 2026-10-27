---
title: "泛型表达输入输出的关联"
sourceKey: "official-notes-v1:typescript:generics:泛型表达输入输出的关联"
categoryId: "typescript"
topicIds: ["typescript:generics"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/generics.html"
sourceKind: "curated"
kind: "concept"
aliases: ["generics"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 泛型表达输入输出的关联

**原理**：泛型保留输入类型与输出类型之间的关系，约束限制可接受的类型能力。

**常见误区**：把参数和返回值都写成 any 会丢失关联；约束不代表运行时验证。

**回答要点**：说明类型参数推断、extends 约束及何时确实需要泛型。
