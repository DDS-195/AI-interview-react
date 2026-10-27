---
title: "任务与微任务的顺序"
sourceKey: "starter-v1:browser:event-loop:任务与微任务的顺序"
categoryId: "browser"
topicIds: ["browser:event-loop"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["任务与微任务的顺序"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

当前任务执行结束并清空调用栈后,浏览器检查并清空微任务队列,再继续其他任务。Promise 回调和 queueMicrotask 常用于微任务;渲染并不是每个任务后必定发生一次。
