---
title: "Effect 的更新顺序"
sourceKey: "starter-v1:react:effects:Effect 的更新顺序"
categoryId: "react"
topicIds: ["react:effects"]
sourceUrl: "https://react.dev/reference/react/useEffect"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["Effect 的更新顺序"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

依赖改变后的提交会先执行旧依赖对应的 cleanup,再执行新依赖的 setup;组件卸载执行最后的 cleanup。清理应撤销这次 setup 建立的连接或订阅。
