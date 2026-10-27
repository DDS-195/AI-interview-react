---
title: "Map 查找与对象身份"
sourceKey: "official-notes-v1:algorithm:map:Map 查找与对象身份"
categoryId: "algorithm"
topicIds: ["algorithm:map"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map"
sourceKind: "curated"
kind: "concept"
aliases: ["map"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Map 查找与对象身份

**原理**：使用 Map 保存键到值的映射，可以避免每次通过数组扫描找到同一实体。

**常见误区**：对象键按身份匹配；规范要求平均访问低于线性，但不保证所有实现和操作严格 O(1)。

**回答要点**：明确键类型、等价规则、重复键处理与额外存储成本。
