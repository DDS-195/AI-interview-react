---
title: "CSRF 与请求来源校验"
sourceKey: "official-notes-v1:security:csrf:CSRF 与请求来源校验"
categoryId: "security"
topicIds: ["security:csrf"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"
sourceKind: "curated"
kind: "concept"
aliases: ["csrf"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## CSRF 与请求来源校验

**原理**：浏览器自动携带认证信息可能使跨站请求冒用用户身份；令牌及来源校验可约束敏感操作。

**常见误区**：仅隐藏按钮或使用 POST 不构成 CSRF 防护；存在 XSS 时很多防护也会失效。

**回答要点**：说明自动凭据、令牌、Origin 校验及 SameSite 的辅助作用。
