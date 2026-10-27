---
title: "useId 与列表 key 的区别"
sourceKey: "official-notes-v1:react:ids:useId 与列表 key 的区别"
categoryId: "react"
topicIds: ["react:ids"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useId"
sourceKind: "curated"
kind: "concept"
aliases: ["ids"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## useId 与列表 key 的区别

**原理**：useId 生成适合连接表单标签与控件的标识，并支持服务端与客户端的一致使用。

**常见误区**：useId 不应当作列表 key；key 应来自能代表业务实体的稳定数据。

**回答要点**：区分可访问性标识与协调身份，说明多实例表单的 ID 冲突处理。
