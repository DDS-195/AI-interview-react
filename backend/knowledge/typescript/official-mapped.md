---
title: "映射类型与修饰符"
sourceKey: "official-notes-v1:typescript:mapped:映射类型与修饰符"
categoryId: "typescript"
topicIds: ["typescript:mapped"]
technicalVersion: "TypeScript 5.x"
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html"
sourceKind: "curated"
kind: "concept"
aliases: ["mapped"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 映射类型与修饰符

**原理**：映射类型遍历键生成新属性，可增加或移除 readonly、可选修饰符，也可重新映射键。

**常见误区**：类型层面 readonly 不会冻结运行时对象；属性重映射也不会自动改真实数据。

**回答要点**：说明键集合、属性类型与修饰符变化，区分类型转换与值转换。
