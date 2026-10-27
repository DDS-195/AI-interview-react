---
title: "条件类型的分配行为"
sourceKey: "official-notes-v1:typescript:conditional:条件类型的分配行为"
categoryId: "typescript"
topicIds: ["typescript:conditional"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html"
sourceKind: "curated"
kind: "concept"
aliases: ["conditional"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 条件类型的分配行为

**原理**：条件类型按类型关系选择结果；裸类型参数遇到联合时可逐成员分配。

**常见误区**：需要整体判断联合时可用元组包裹双方；infer 只在对应条件模式中提取类型。

**回答要点**：区分逐成员计算与整体判断，说明推断位置与 never 结果。
