---
title: "D3 数据连接与稳定键"
sourceKey: "official-notes-v1:graphics:d3:D3 数据连接与稳定键"
categoryId: "graphics"
topicIds: ["graphics:d3"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://d3js.org/d3-selection/joining"
sourceKind: "curated"
kind: "concept"
aliases: ["d3"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## D3 数据连接与稳定键

**原理**：数据连接把数据与元素匹配，通过 enter、update、exit 管理加入、更新和移除。

**常见误区**：默认按位置匹配，重排时可能把旧元素关联到不同实体；稳定 key 可保留实体对应关系。

**回答要点**：说明键函数、更新集合及删除元素，避免每次整体重建。
