---
title: "联合类型与共同能力"
sourceKey: "official-notes-v1:typescript:unions:联合类型与共同能力"
categoryId: "typescript"
topicIds: ["typescript:unions"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html"
sourceKind: "curated"
kind: "concept"
aliases: ["unions"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 联合类型与共同能力

**原理**：联合类型表示值可能属于多个成员，直接操作前只能使用成员共同允许的能力。

**常见误区**：联合不是把所有属性无条件合并；强制断言会绕过必要判断。

**回答要点**：通过可辨识字段或运行时判断收窄，再访问特定成员。
