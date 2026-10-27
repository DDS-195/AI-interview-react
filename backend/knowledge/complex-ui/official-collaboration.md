---
title: "协同编辑的共享模型与连接"
sourceKey: "official-notes-v1:complex-ui:collaboration:协同编辑的共享模型与连接"
categoryId: "complex-ui"
topicIds: ["complex-ui:collaboration"]
technicalVersion: "现代浏览器；涉及编辑器库时明确库版本，不假定未给出的接口"
sourceUrl: "https://docs.yjs.dev/getting-started/a-collaborative-editor"
sourceKind: "curated"
kind: "concept"
aliases: ["collaboration"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 协同编辑的共享模型与连接

**原理**：协同编辑把共享文档模型、编辑器绑定与通信提供者连接起来，多个客户端同步修改。

**常见误区**：共享内容与在线光标等临时存在状态应分清；断开连接不能当作永久保存成功。

**回答要点**：说明模型、绑定、传输、离线恢复与资源释放的职责。
