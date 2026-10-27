---
title: "Cookie 属性的防护边界"
sourceKey: "official-notes-v1:security:cookie:Cookie 属性的防护边界"
categoryId: "security"
topicIds: ["security:cookie"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie"
sourceKind: "curated"
kind: "concept"
aliases: ["cookie"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Cookie 属性的防护边界

**原理**：HttpOnly 限制脚本读取，Secure 限制安全连接传输，SameSite 约束部分跨站发送情形。

**常见误区**：HttpOnly 不阻止浏览器发起带 Cookie 的请求；SameSite 也不等于完整鉴权。

**回答要点**：说明每个属性解决的威胁、范围与仍需服务端校验的部分。
