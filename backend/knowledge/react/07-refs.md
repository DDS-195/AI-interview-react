---
title: "ref 与渲染状态"
sourceKey: "starter-v1:react:refs:ref 与渲染状态"
categoryId: "react"
topicIds: ["react:refs"]
sourceUrl: "https://react.dev/reference/react/useRef"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["ref 与渲染状态"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

useRef 返回的对象跨渲染保持身份,修改 current 不触发重新渲染。适合保存 DOM 引用或无需展示的值;需要随值变化更新界面的数据应使用 state。
