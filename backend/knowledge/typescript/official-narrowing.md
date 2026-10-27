---
title: "类型收窄与可辨识联合"
sourceKey: "official-notes-v1:typescript:narrowing:类型收窄与可辨识联合"
categoryId: "typescript"
topicIds: ["typescript:narrowing"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html"
sourceKind: "curated"
kind: "concept"
aliases: ["narrowing"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 类型收窄与可辨识联合

**原理**：typeof、in、判别字段与控制流可以缩小类型范围；never 可帮助检查分支穷尽性。

**常见误区**：真值判断会同时排除空字符串等有效值；自写类型谓词仍需保证运行时逻辑正确。

**回答要点**：展示可靠判别条件、完整分支和不可达类型。
