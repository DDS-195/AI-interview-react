---
title: "跨域与预检"
sourceKey: "starter-v1:network:cors:跨域与预检"
categoryId: "network"
topicIds: ["network:cors"]
sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["跨域与预检"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

CORS 由服务端响应头参与授权浏览器读取跨源响应;符合条件的简单请求不预检。使用非简单方法或请求头等情况通常先发送 OPTIONS 预检,不能只按 GET 或 POST 判断。
