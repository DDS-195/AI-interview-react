---
title: "Svelte 5 的 $state 与代理"
sourceKey: "official-notes-v1:jquery:svelte-runes:Svelte 5 的 $state 与代理"
categoryId: "jquery"
topicIds: ["jquery:svelte-runes"]
technicalVersion: "Svelte 5，Runes模式"
sourceUrl: "https://svelte.dev/docs/svelte/$state"
sourceKind: "curated"
kind: "concept"
aliases: ["svelte-runes"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Svelte 5 的 $state 与代理

**原理**：Svelte 5 的 $state 创建响应式状态，普通对象和数组可形成深层响应式代理。

**常见误区**：读取后保存为普通局部值不等于持续保持响应式关系；类实例等不应假定全部深度代理。

**回答要点**：明确 Svelte 5，区分状态声明、代理读写与快照。
