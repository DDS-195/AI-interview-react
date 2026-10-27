---
title: "状态快照与闭包"
sourceKey: "starter-v1:react:snapshots:状态快照与闭包"
categoryId: "react"
topicIds: ["react:snapshots"]
sourceUrl: "https://react.dev/learn/state-as-a-snapshot"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["状态快照与闭包"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

一次渲染中的 state、事件处理函数与局部变量属于该次快照。设置 state 请求新渲染,不会改写当前处理函数捕获的值;异步回调仍可能读取旧快照。
