---
title: "普通函数与箭头函数的 this"
sourceKey: "starter-v1:javascript:this:普通函数与箭头函数的 this"
categoryId: "javascript"
topicIds: ["javascript:this"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["普通函数与箭头函数的 this"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

普通函数的 this 通常由调用方式决定;箭头函数从外层词法环境捕获 this,不能通过 call、apply 或 bind 改绑。方法被取出单独调用时,不能假设仍绑定原对象。
