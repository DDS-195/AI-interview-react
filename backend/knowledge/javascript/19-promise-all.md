---
title: "Promise.all 的结果顺序"
sourceKey: "starter-v1:javascript:promise-all:Promise.all 的结果顺序"
categoryId: "javascript"
topicIds: ["javascript:promise-all"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["Promise.all 的结果顺序"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

Promise.all 全部成功时,结果数组按输入的迭代顺序排列,不按完成顺序排列。普通值可作为输入;空可迭代对象也会得到成功状态的 Promise。
