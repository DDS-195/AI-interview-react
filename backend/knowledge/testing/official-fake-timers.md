---
title: "虚拟计时器与异步队列"
sourceKey: "official-notes-v1:testing:fake-timers:虚拟计时器与异步队列"
categoryId: "testing"
topicIds: ["testing:fake-timers"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://vitest.dev/guide/mocking/timers"
sourceKind: "curated"
kind: "concept"
aliases: ["fake-timers"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 虚拟计时器与异步队列

**原理**：虚拟计时器允许主动推进时间，稳定测试防抖、超时与轮询，并在结束后恢复真实计时器。

**常见误区**：推进定时器不等于所有 Promise 微任务都自动完成；测试需匹配异步推进方式。

**回答要点**：说明时间控制、任务等待与清理，避免测试之间相互污染。
