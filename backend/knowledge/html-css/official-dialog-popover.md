---
title: "dialog 的模态与非模态打开"
sourceKey: "official-notes-v1:html-css:dialog-popover:dialog 的模态与非模态打开"
categoryId: "html-css"
topicIds: ["html-css:dialog-popover"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog"
sourceKind: "curated"
kind: "concept"
aliases: ["dialog-popover"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## dialog 的模态与非模态打开

**原理**：showModal 打开模态对话框并进入顶层显示，show 则创建非模态对话框。

**常见误区**：只添加 open 属性不等同于完整模态交互；初始焦点与关闭后焦点仍须合理安排。

**回答要点**：区分模态语义、焦点、关闭与 backdrop，避免把弹层仅当作高 z-index。
