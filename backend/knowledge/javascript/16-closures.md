---
title: "闭包与词法环境"
sourceKey: "starter-v1:javascript:closures:闭包与词法环境"
categoryId: "javascript"
topicIds: ["javascript:closures"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["闭包与词法环境"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

闭包是函数及其词法环境的组合,函数能访问创建位置的外部绑定。闭包不等于复制所有值;被保持的环境也可能延长对象生命周期,但闭包本身不必然造成内存泄漏。
