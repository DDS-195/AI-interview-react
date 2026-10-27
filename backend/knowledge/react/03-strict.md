---
title: "StrictMode 的开发检查"
sourceKey: "starter-v1:react:strict:StrictMode 的开发检查"
categoryId: "react"
topicIds: ["react:strict"]
sourceUrl: "https://react.dev/reference/react/useEffect"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["StrictMode 的开发检查"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

开发环境的 StrictMode 会额外进行一次 Effect setup 与 cleanup 检查,以发现清理缺失。应正确实现清理,不能把这个开发检查等同于生产环境每次都重复执行。
