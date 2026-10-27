---
title: "原型链查找"
sourceKey: "starter-v1:javascript:prototype:原型链查找"
categoryId: "javascript"
topicIds: ["javascript:prototype"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["原型链查找"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

访问对象属性先查自有属性,未找到时沿原型链向上查找,直到 null。构造函数的 prototype 与实例的原型关联不同于实例上的普通 prototype 属性。
