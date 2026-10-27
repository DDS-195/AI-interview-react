---
title: "satisfies 保留推断结果"
sourceKey: "official-notes-v1:typescript:satisfies:satisfies 保留推断结果"
categoryId: "typescript"
topicIds: ["typescript:satisfies"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html"
sourceKind: "curated"
kind: "concept"
aliases: ["satisfies"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## satisfies 保留推断结果

**原理**：satisfies 检查表达式是否满足目标类型，同时保留表达式本身的推断信息。

**常见误区**：它不是运行时验证，也不是把值强制变成目标类型；仍受对象字面量检查规则约束。

**回答要点**：对比类型标注、as 断言与 satisfies，说明校验与推断的区别。
