---
title: "属性描述符与默认值"
sourceKey: "official-notes-v1:javascript:descriptors:属性描述符与默认值"
categoryId: "javascript"
topicIds: ["javascript:descriptors"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty"
sourceKind: "curated"
kind: "concept"
aliases: ["descriptors"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 属性描述符与默认值

**原理**：defineProperty 可定义数据属性或访问器属性，控制可写、可枚举与可配置行为。

**常见误区**：描述符省略的 writable、enumerable、configurable 默认是 false；value 与 get 不能混成一个描述符。

**回答要点**：说明两类描述符、赋值差异及对象接口约束。
