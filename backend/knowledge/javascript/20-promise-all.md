---
title: "Promise.all 的拒绝边界"
sourceKey: "starter-v1:javascript:promise-all:Promise.all 的拒绝边界"
categoryId: "javascript"
topicIds: ["javascript:promise-all"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["Promise.all 的拒绝边界"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

任意输入拒绝会让聚合 Promise 拒绝,但不自动取消其他进行中的工作。若必须拿到每项成功或失败结果,可以使用 Promise.allSettled;取消任务需独立的取消机制。
