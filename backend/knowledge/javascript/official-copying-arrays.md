---
title: "toSorted 与原数组的关系"
sourceKey: "official-notes-v1:javascript:copying-arrays:toSorted 与原数组的关系"
categoryId: "javascript"
topicIds: ["javascript:copying-arrays"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted"
sourceKind: "curated"
kind: "concept"
aliases: ["copying-arrays"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## toSorted 与原数组的关系

**原理**：toSorted 返回排序后的新数组，不修改原数组，是 ECMAScript 2023 的复制式方法。

**常见误区**：复制的是数组结构，内部对象仍共享引用；使用前需核对目标浏览器支持。

**回答要点**：区分原地 sort、复制排序与深复制，说明比较函数的用途。
