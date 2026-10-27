---
title: "LCP 的资源发现与优先级"
sourceKey: "official-notes-v1:performance:loading:LCP 的资源发现与优先级"
categoryId: "performance"
topicIds: ["performance:loading"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://web.dev/articles/optimize-lcp"
sourceKind: "curated"
kind: "concept"
aliases: ["loading"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## LCP 的资源发现与优先级

**原理**：主要内容呈现取决于服务响应、资源发现、下载与最终渲染，关键资源需及时被发现。

**常见误区**：仅压缩图片不一定解决迟发现或等待脚本的问题；过多高优先级资源会相互竞争。

**回答要点**：拆分延迟来源，解释预加载、请求优先级与减少渲染阻塞。
