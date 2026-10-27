---
title: "核心体验指标与统计分位"
sourceKey: "official-notes-v1:performance:vitals:核心体验指标与统计分位"
categoryId: "performance"
topicIds: ["performance:vitals"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://web.dev/articles/vitals"
sourceKind: "curated"
kind: "concept"
aliases: ["vitals"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 核心体验指标与统计分位

**原理**：LCP 描述主要内容呈现，INP 描述交互响应，CLS 描述布局稳定性，侧重点不同。

**常见误区**：只看本机一次加载无法代表真实用户体验；现场数据需结合设备和统计分位判断。

**回答要点**：区分加载、交互与稳定性，先定位指标对应瓶颈再优化。
