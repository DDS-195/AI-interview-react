---
title: "日期格式与时区显示"
sourceKey: "official-notes-v1:accessibility:dates:日期格式与时区显示"
categoryId: "accessibility"
topicIds: ["accessibility:dates"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat"
sourceKind: "curated"
kind: "concept"
aliases: ["dates"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 日期格式与时区显示

**原理**：Intl.DateTimeFormat 按区域、时区和显示选项格式化日期，显示规则应显式确定。

**常见误区**：同一时间戳在不同默认时区可显示为不同日期；格式化不负责解析任意本地日期字符串。

**回答要点**：区分时间点、时区与展示文本，避免只截取字符串表示业务日期。
