---
title: "动态 import 与分包"
sourceKey: "starter-v1:engineering:splitting:动态 import 与分包"
categoryId: "engineering"
topicIds: ["engineering:splitting"]
sourceUrl: "https://webpack.js.org/guides/code-splitting/"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["动态 import 与分包"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

构建工具可把动态 import 的模块拆成异步块,按访问需要加载以减小初始资源。分包仍有请求和依赖成本;不是拆得越细越快,需要结合用户路径与实际产物检查。
