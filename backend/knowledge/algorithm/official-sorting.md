---
title: "数组排序的比较函数契约"
sourceKey: "official-notes-v1:algorithm:sorting:数组排序的比较函数契约"
categoryId: "algorithm"
topicIds: ["algorithm:sorting"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort"
sourceKind: "curated"
kind: "concept"
aliases: ["sorting"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 数组排序的比较函数契约

**原理**：比较函数以负、零、正表示顺序，需保持一致性；sort 修改原数组且默认按字符串规则比较。

**常见误区**：数字默认排序不是数值排序；返回不一致比较结果可能使行为难以预测。

**回答要点**：说明比较规则、稳定性、原地修改与引擎相关复杂度，不能宣称固定排序算法。
