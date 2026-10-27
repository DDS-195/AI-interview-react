---
title: "模板字面量类型的组合"
sourceKey: "official-notes-v1:typescript:template-literals:模板字面量类型的组合"
categoryId: "typescript"
topicIds: ["typescript:template-literals"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html"
sourceKind: "curated"
kind: "concept"
aliases: ["template-literals"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 模板字面量类型的组合

**原理**：模板字面量类型把字符串字面量组合成新类型，可用于事件名或受约束的键名。

**常见误区**：联合组合会扩大候选集合，大规模字符串组合可能增加类型检查成本。

**回答要点**：说明命名约束、联合展开和必要时改用更简单类型。
