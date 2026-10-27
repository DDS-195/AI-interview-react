---
title: "组合控件的键盘导航约定"
sourceKey: "official-notes-v1:accessibility:keyboard:组合控件的键盘导航约定"
categoryId: "accessibility"
topicIds: ["accessibility:keyboard"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/"
sourceKind: "curated"
kind: "concept"
aliases: ["keyboard"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 组合控件的键盘导航约定

**原理**：普通控件通过 Tab 切换，组合控件常通过方向键在内部导航，焦点与选中状态需分清。

**常见误区**：所有内部项都放入 Tab 顺序可能造成大量停留点；键盘处理不能破坏原生输入行为。

**回答要点**：说明焦点管理、可见焦点与预期键盘模式。
