---
title: "Promise.all 的快速失败边界"
sourceKey: "official-notes-v1:javascript:promise-all:Promise.all 的快速失败边界"
categoryId: "javascript"
topicIds: ["javascript:promise-all"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all"
sourceKind: "curated"
kind: "concept"
aliases: ["promise-all"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Promise.all 的快速失败边界

**原理**：所有输入成功才得到按输入顺序排列的结果；任意拒绝会使组合结果拒绝。

**常见误区**：组合 Promise 拒绝不会取消其他已经开始的任务；需要取消时应另行传递信号。

**回答要点**：区分结果聚合、完成顺序、错误传播和任务取消。
