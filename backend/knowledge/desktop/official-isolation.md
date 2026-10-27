---
title: "Electron 上下文隔离与远程内容"
sourceKey: "official-notes-v1:desktop:isolation:Electron 上下文隔离与远程内容"
categoryId: "desktop"
topicIds: ["desktop:isolation"]
technicalVersion: "Electron；题干明确版本，使用contextIsolation与沙箱，不向渲染进程暴露任意Node能力"
sourceUrl: "https://www.electronjs.org/docs/latest/tutorial/security"
sourceKind: "curated"
kind: "concept"
aliases: ["isolation"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Electron 上下文隔离与远程内容

**原理**：上下文隔离将 preload 能力与页面环境分开，配合受限桥接和导航控制降低风险。

**常见误区**：上下文隔离不等于可以随意暴露文件或执行接口；远程内容更需限制能力。

**回答要点**：说明 sandbox、nodeIntegration、桥接与导航来源的关系。
