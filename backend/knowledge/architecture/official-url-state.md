---
title: "URL 状态与参数编码"
sourceKey: "official-notes-v1:architecture:url-state:URL 状态与参数编码"
categoryId: "architecture"
topicIds: ["architecture:url-state"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams"
sourceKind: "curated"
kind: "concept"
aliases: ["url-state"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## URL 状态与参数编码

**原理**：可分享的搜索、分页等状态可放 URL 参数，URLSearchParams 负责键值解析与编码。

**常见误区**：直接拼接包含特殊字符的值可能改变参数结构；重复键须明确使用 get 还是 getAll。

**回答要点**：说明序列化、默认值、非法参数校验和前进后退恢复。
