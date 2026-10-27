---
title: "useDeferredValue 与防抖的区别"
sourceKey: "official-notes-v1:react:deferred:useDeferredValue 与防抖的区别"
categoryId: "react"
topicIds: ["react:deferred"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useDeferredValue"
sourceKind: "curated"
kind: "concept"
aliases: ["deferred"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## useDeferredValue 与防抖的区别

**原理**：deferred 值允许较重结果界面稍后跟上最新输入，中间继续显示旧值。

**常见误区**：它没有固定延时，不负责限制网络请求次数，不能直接替代防抖。

**回答要点**：说明旧结果提示、渲染优先级和请求节流应分开处理。
