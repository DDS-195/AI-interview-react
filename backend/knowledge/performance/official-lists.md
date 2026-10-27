---
title: "长列表的窗口化代价"
sourceKey: "official-notes-v1:performance:lists:长列表的窗口化代价"
categoryId: "performance"
topicIds: ["performance:lists"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://web.dev/articles/virtualize-long-lists-react-window"
sourceKind: "curated"
kind: "concept"
aliases: ["lists"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 长列表的窗口化代价

**原理**：窗口化只渲染当前可见区附近的行，减少 DOM 数量与更新成本。

**常见误区**：动态高度、滚动定位和键盘访问仍需设计；少量数据分页可能更容易实现。

**回答要点**：说明视口、缓冲区、稳定 key 与测量成本，按实际数据规模选择。
