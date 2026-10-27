---
title: "优先级与层叠判断顺序"
sourceKey: "official-notes-v1:html-css:cascade:优先级与层叠判断顺序"
categoryId: "html-css"
topicIds: ["html-css:cascade"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity"
sourceKind: "curated"
kind: "concept"
aliases: ["cascade"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 优先级与层叠判断顺序

**原理**：选择器权重用于层叠条件相同时的竞争；还须先考虑来源、重要性与层叠层。

**常见误区**：不是出现 !important 就无条件赢，也不能简单靠增加选择器长度判断。

**回答要点**：按层叠条件、权重与源代码顺序逐步判断，避免无限叠加覆盖规则。
