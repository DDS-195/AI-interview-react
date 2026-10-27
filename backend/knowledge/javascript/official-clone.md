---
title: "structuredClone 的可克隆边界"
sourceKey: "official-notes-v1:javascript:clone:structuredClone 的可克隆边界"
categoryId: "javascript"
topicIds: ["javascript:clone"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone"
sourceKind: "curated"
kind: "concept"
aliases: ["clone"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## structuredClone 的可克隆边界

**原理**：structuredClone 支持许多内建类型及循环引用，可通过 transfer 转移可转移资源。

**常见误区**：函数等不可序列化值会失败；克隆不等于完整保留自定义对象原型和属性描述符。

**回答要点**：区分深复制、结构化克隆与资源转移，说明适用数据类型。
