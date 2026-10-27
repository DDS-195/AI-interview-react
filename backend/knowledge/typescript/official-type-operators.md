---
title: "keyof 与索引访问类型"
sourceKey: "official-notes-v1:typescript:type-operators:keyof 与索引访问类型"
categoryId: "typescript"
topicIds: ["typescript:type-operators"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html"
sourceKind: "curated"
kind: "concept"
aliases: ["type-operators"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## keyof 与索引访问类型

**原理**：T[K] 提取类型 T 指定键上的值类型，配合 keyof 可约束合法属性访问。

**常见误区**：这里的索引发生在类型系统中，不会执行真实对象读取，也不会保证外部数据符合类型。

**回答要点**：说明键和值类型的关联，以及泛型访问函数的约束。
