---
title: "列表身份与 key"
sourceKey: "starter-v1:react:keys:列表身份与 key"
categoryId: "react"
topicIds: ["react:keys"]
sourceUrl: "https://react.dev/learn/rendering-lists"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["列表身份与 key"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

key 帮助 React 在同级列表中识别元素身份,应稳定且与数据关联。重排或插入列表时用索引作 key 可能错误复用状态;每次随机生成 key 会导致重新挂载。
