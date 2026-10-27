---
title: "PerformanceObserver 的持续观测"
sourceKey: "official-notes-v1:performance:measurement:PerformanceObserver 的持续观测"
categoryId: "performance"
topicIds: ["performance:measurement"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver"
sourceKind: "curated"
kind: "concept"
aliases: ["measurement"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## PerformanceObserver 的持续观测

**原理**：PerformanceObserver 接收支持类型的性能条目，可避免只在一个时刻读取历史数据。

**常见误区**：不同浏览器支持的条目类型不同；收集数据还需限制量与及时断开无用观察。

**回答要点**：说明条目类型、缓冲读取与测量范围，区分指标与具体故障原因。
