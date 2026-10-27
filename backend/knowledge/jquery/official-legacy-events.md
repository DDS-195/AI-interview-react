---
title: "jQuery 事件委托与命名空间"
sourceKey: "official-notes-v1:jquery:legacy-events:jQuery 事件委托与命名空间"
categoryId: "jquery"
topicIds: ["jquery:legacy-events"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://api.jquery.com/on/"
sourceKind: "curated"
kind: "concept"
aliases: ["legacy-events"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## jQuery 事件委托与命名空间

**原理**：on 可把处理器注册在稳定祖先并按选择器处理后代事件，适合动态加入的元素。

**常见误区**：冒泡到祖先后 event.target 与委托匹配元素可能不同；重复绑定会造成多次调用。

**回答要点**：说明委托范围、事件命名空间及卸载时精确解除。
