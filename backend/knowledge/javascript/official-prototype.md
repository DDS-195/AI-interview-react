---
title: "原型查找与自身属性"
sourceKey: "official-notes-v1:javascript:prototype:原型查找与自身属性"
categoryId: "javascript"
topicIds: ["javascript:prototype"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain"
sourceKind: "curated"
kind: "concept"
aliases: ["prototype"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 原型查找与自身属性

**原理**：读取属性先查对象自身，再沿原型链查找；写入普通属性通常创建或更新自身属性。

**常见误区**：for...in 可能包含继承的可枚举属性；__proto__ 不是所有对象都可靠拥有的普通字段。

**回答要点**：说明查找链、自身属性判断与构造函数 prototype 的区别。
