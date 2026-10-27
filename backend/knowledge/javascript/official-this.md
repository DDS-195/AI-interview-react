---
title: "this 由调用方式决定"
sourceKey: "official-notes-v1:javascript:this:this 由调用方式决定"
categoryId: "javascript"
topicIds: ["javascript:this"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this"
sourceKind: "curated"
kind: "concept"
aliases: ["this"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## this 由调用方式决定

**原理**：普通函数的 this 与调用方式有关，可由方法调用、call、apply 或 bind 确定。

**常见误区**：箭头函数使用外层 this，无法通过 bind 改为另一个 this；取出方法再调用可能丢失对象绑定。

**回答要点**：对照方法调用与独立调用解释，避免只看函数定义位置。
