---
title: "Effect 的依赖比较"
sourceKey: "starter-v1:react:effects:Effect 的依赖比较"
categoryId: "react"
topicIds: ["react:effects"]
sourceUrl: "https://react.dev/reference/react/useEffect"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["Effect 的依赖比较"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

依赖数组须列出 Effect 使用的响应式值,React 对每项用 Object.is 比较。新建的对象或函数可能导致重新执行;不能通过删掉实际依赖掩盖闭包陈旧问题。
