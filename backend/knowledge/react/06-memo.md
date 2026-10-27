---
title: "useMemo 的使用边界"
sourceKey: "starter-v1:react:memo:useMemo 的使用边界"
categoryId: "react"
topicIds: ["react:memo"]
sourceUrl: "https://react.dev/reference/react/useMemo"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["useMemo 的使用边界"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

useMemo 按依赖缓存计算结果,是性能优化手段。计算应为纯函数;不能依赖缓存永不丢失来保证业务正确性。应先确认计算或对象身份引发的性能问题,再增加缓存。
