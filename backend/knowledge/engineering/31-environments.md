---
title: "前端环境变量的可见性"
sourceKey: "starter-v1:engineering:environments:前端环境变量的可见性"
categoryId: "engineering"
topicIds: ["engineering:environments"]
sourceUrl: "https://vite.dev/guide/env-and-mode"
sourceKind: "curated"
kind: "concept"
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
aliases: ["前端环境变量的可见性"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

Vite 暴露给客户端的变量会进入前端产物,默认只有 VITE_ 前缀的变量被公开。API 密钥应保留在后端;改变变量前缀也不能把已打进客户端的值变成秘密。
