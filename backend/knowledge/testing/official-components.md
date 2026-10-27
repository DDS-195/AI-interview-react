---
title: "按用户可见角色查询组件"
sourceKey: "official-notes-v1:testing:components:按用户可见角色查询组件"
categoryId: "testing"
topicIds: ["testing:components"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://testing-library.com/docs/queries/about/"
sourceKind: "curated"
kind: "concept"
aliases: ["components"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 按用户可见角色查询组件

**原理**：组件测试优先通过角色、可访问名称或标签找到控件，更贴近真实使用方式。

**常见误区**：依赖深层 CSS 结构或私有状态会让重构破坏无关测试；异步出现需使用等待型查询。

**回答要点**：区分 get、query、find 的存在性与等待语义。
