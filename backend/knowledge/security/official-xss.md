---
title: "上下文编码与安全输出"
sourceKey: "official-notes-v1:security:xss:上下文编码与安全输出"
categoryId: "security"
topicIds: ["security:xss"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"
sourceKind: "curated"
kind: "concept"
aliases: ["xss"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 上下文编码与安全输出

**原理**：不可信内容按文本、属性、URL 等不同输出位置采用相应处理；富文本须使用合适的净化方案。

**常见误区**：过滤几个 script 字样无法覆盖全部攻击；CSP 适合作为额外防护，不能替代正确输出处理。

**回答要点**：指出输入来源、输出位置、安全 API 与需要净化的边界。
