---
title: "ES Module 的静态绑定"
sourceKey: "official-notes-v1:javascript:modules:ES Module 的静态绑定"
categoryId: "javascript"
topicIds: ["javascript:modules"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules"
sourceKind: "curated"
kind: "concept"
aliases: ["modules"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## ES Module 的静态绑定

**原理**：静态 import 描述模块依赖，导入绑定反映导出方绑定变化，模块拥有独立作用域。

**常见误区**：导入方不能直接给导入绑定重新赋值；模块循环也可能遇到尚未初始化的绑定。

**回答要点**：说明静态依赖、活绑定、导出接口与动态 import 的异步入口。
