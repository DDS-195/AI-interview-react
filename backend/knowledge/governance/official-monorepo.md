---
title: "Workspace 的本地依赖关系"
sourceKey: "official-notes-v1:governance:monorepo:Workspace 的本地依赖关系"
categoryId: "governance"
topicIds: ["governance:monorepo"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://pnpm.io/workspaces"
sourceKind: "curated"
kind: "concept"
aliases: ["monorepo"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Workspace 的本地依赖关系

**原理**：Workspace 把多个包组织在统一工作区；workspace 协议明确依赖应由本地工作区提供。

**常见误区**：同仓库不意味着包边界自动清晰；跨包直接访问内部文件会绕过公开接口。

**回答要点**：说明包声明、依赖关系、发布时版本转换与可见接口。
