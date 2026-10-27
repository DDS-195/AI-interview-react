---
title: "闭包引用的是词法环境"
sourceKey: "official-notes-v1:javascript:closures:闭包引用的是词法环境"
categoryId: "javascript"
topicIds: ["javascript:closures"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"
sourceKind: "curated"
kind: "concept"
aliases: ["closures"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 闭包引用的是词法环境

**原理**：函数创建时保留对外层词法环境的访问，即使外层调用已经结束仍可读取变量。

**常见误区**：闭包并非自动复制变量值；多个回调可能引用同一绑定，循环使用 let 可形成独立绑定。

**回答要点**：区分绑定与值，并说明长时间持有大对象时的资源释放。
