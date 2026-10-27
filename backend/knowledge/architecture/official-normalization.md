---
title: "状态归一化与重复数据"
sourceKey: "official-notes-v1:architecture:normalization:状态归一化与重复数据"
categoryId: "architecture"
topicIds: ["architecture:normalization"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://react.dev/learn/choosing-the-state-structure"
sourceKind: "curated"
kind: "concept"
aliases: ["normalization"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 状态归一化与重复数据

**原理**：关联实体可按 ID 保存，选中状态记录 ID，派生信息在读取时计算，减少重复来源。

**常见误区**：同一实体复制到多个状态容易更新不同步；可计算的字段不必重复保存。

**回答要点**：说明单一数据来源、关联关系与派生值，避免过度嵌套。
