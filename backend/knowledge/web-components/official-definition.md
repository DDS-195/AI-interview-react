---
title: "自定义元素注册与生命周期"
sourceKey: "official-notes-v1:web-components:definition:自定义元素注册与生命周期"
categoryId: "web-components"
topicIds: ["web-components:definition"]
technicalVersion: "现代浏览器原生Web Components；明确API支持与降级，不假定所有浏览器一致"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements"
sourceKind: "curated"
kind: "concept"
aliases: ["definition"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 自定义元素注册与生命周期

**原理**：通过 customElements.define 注册含连字符名称的元素类，连接和断开回调处理资源。

**常见误区**：connectedCallback 可能因移动等操作多次触发，不能假定只执行一次初始化。

**回答要点**：说明注册、属性观察、连接与断开清理，区分构造和接入 DOM。
