---
title: "Electron IPC 的最小接口"
sourceKey: "official-notes-v1:desktop:ipc:Electron IPC 的最小接口"
categoryId: "desktop"
topicIds: ["desktop:ipc"]
technicalVersion: "Electron；题干明确版本，使用contextIsolation与沙箱，不向渲染进程暴露任意Node能力"
sourceUrl: "https://www.electronjs.org/docs/latest/tutorial/ipc"
sourceKind: "curated"
kind: "concept"
aliases: ["ipc"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Electron IPC 的最小接口

**原理**：主进程与渲染进程通过明确通道交换消息，preload 暴露受控业务接口。

**常见误区**：不能把整个 ipcRenderer 任意交给网页；请求参数、来源和返回数据应校验。

**回答要点**：说明 invoke 与 handle、事件式通信以及跨边界的最小能力。
