---
title: "宽松相等与严格相等"
sourceKey: "official-notes-v1:javascript:equality:宽松相等与严格相等"
categoryId: "javascript"
topicIds: ["javascript:equality"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality"
sourceKind: "curated"
kind: "concept"
aliases: ["equality"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 宽松相等与严格相等

**原理**：== 按规范进行类型转换后比较；=== 避免这类转换，但对象仍按引用比较。

**常见误区**：不能通过 == 判断两个对象内容相同；null 与 undefined 的宽松相等是特定规则。

**回答要点**：先辨别操作数类型，再解释转换与对象身份，避免凭直觉猜结果。
