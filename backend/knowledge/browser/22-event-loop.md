---
title: "微任务链与饥饿"
sourceKey: "starter-v1:browser:event-loop:微任务链与饥饿"
categoryId: "browser"
topicIds: ["browser:event-loop"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["微任务链与饥饿"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

微任务执行期间加入的新微任务也会在该次检查中继续执行。无界递归添加微任务可能阻止后续任务与渲染获得机会,不能把微任务当成自动让出主线程的方法。
