---
title: "端到端测试的隔离与等待"
sourceKey: "official-notes-v1:testing:e2e:端到端测试的隔离与等待"
categoryId: "testing"
topicIds: ["testing:e2e"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://playwright.dev/docs/best-practices"
sourceKind: "curated"
kind: "concept"
aliases: ["e2e"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 端到端测试的隔离与等待

**原理**：测试独立准备状态，使用稳定定位与自动等待断言验证可见行为。

**常见误区**：固定 sleep 容易在不同设备失败；依赖其他用例留下的数据会使执行顺序影响结果。

**回答要点**：说明隔离、网络控制、重试证据与错误定位。
