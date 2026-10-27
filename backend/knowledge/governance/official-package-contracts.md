---
title: "包入口与公开接口约定"
sourceKey: "official-notes-v1:governance:package-contracts:包入口与公开接口约定"
categoryId: "governance"
topicIds: ["governance:package-contracts"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://docs.npmjs.com/cli/v11/configuring-npm/package-json/"
sourceKind: "curated"
kind: "concept"
aliases: ["package-contracts"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 包入口与公开接口约定

**原理**：package.json 的入口和 exports 声明包对外可导入路径，依赖类别描述消费与开发需求。

**常见误区**：暴露内部目录会增加兼容负担；开发依赖和运行依赖混放可能影响独立消费。

**回答要点**：说明入口、类型声明、条件导出与依赖归属。
