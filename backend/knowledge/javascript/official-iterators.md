---
title: "迭代器与可迭代对象"
sourceKey: "official-notes-v1:javascript:iterators:迭代器与可迭代对象"
categoryId: "javascript"
topicIds: ["javascript:iterators"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols"
sourceKind: "curated"
kind: "concept"
aliases: ["iterators"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 迭代器与可迭代对象

**原理**：迭代器通过 next 返回 value 和 done；可迭代对象提供 Symbol.iterator 生成迭代器。

**常见误区**：普通对象默认不能直接 for...of；可迭代与数组不是同义词。

**回答要点**：区分两个协议，说明生成器、展开语法与提前结束时的清理。
