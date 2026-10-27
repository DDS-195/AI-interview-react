---
title: "Range 与部分内容响应"
sourceKey: "official-notes-v1:network:range:Range 与部分内容响应"
categoryId: "network"
topicIds: ["network:range"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests"
sourceKind: "curated"
kind: "concept"
aliases: ["range"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Range 与部分内容响应

**原理**：Range 请求资源的指定字节范围，成功部分响应使用 206 与 Content-Range。

**常见误区**：服务端可忽略 Range 返回完整 200；无效范围可能得到 416，不能固定按部分内容解析。

**回答要点**：说明范围单位、状态码、断点续传及完整响应回退。
