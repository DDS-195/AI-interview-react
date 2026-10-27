---
title: "Context 更新与 memo"
sourceKey: "starter-v1:react:context:Context 更新与 memo"
categoryId: "react"
topicIds: ["react:context"]
sourceUrl: "https://react.dev/reference/react/useContext"
sourceKind: "curated"
kind: "concept"
technicalVersion: "React 18，函数组件与Hooks"
aliases: ["Context 更新与 memo"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

消费组件读取最近 Provider 的值,Provider 值变化会更新消费者。memo 不能阻止消费者接收新的 Context;可拆分 Context 或稳定必要的对象身份减少无关更新。
