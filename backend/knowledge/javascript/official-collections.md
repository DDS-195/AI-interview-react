---
title: "Map 的键与遍历语义"
sourceKey: "official-notes-v1:javascript:collections:Map 的键与遍历语义"
categoryId: "javascript"
topicIds: ["javascript:collections"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map"
sourceKind: "curated"
kind: "concept"
aliases: ["collections"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Map 的键与遍历语义

**原理**：Map 接受任意类型的键，按插入顺序遍历；对象键按对象身份区分。

**常见误区**：给 map[key] 赋值是普通对象属性，不是 Map 条目；规范不承诺某一种内部哈希实现。

**回答要点**：说明 set、get、has、size，并区分对象键身份与字符串属性。
