---
title: "Vue 3.5 侦听清理的注册时机"
sourceKey: "official-notes-v1:vue:watch-cleanup:Vue 3.5 侦听清理的注册时机"
categoryId: "vue"
topicIds: ["vue:watch-cleanup"]
technicalVersion: "Vue 3.5+ Composition API，onWatcherCleanup同步注册限制"
sourceUrl: "https://cn.vuejs.org/guide/essentials/watchers.html"
sourceKind: "curated"
kind: "concept"
aliases: ["watch-cleanup"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Vue 3.5 侦听清理的注册时机

**原理**：onWatcherCleanup 在侦听器失效时取消旧副作用，例如旧请求。

**常见误区**：Vue 3.5 的 onWatcherCleanup 必须在回调同步阶段注册，不能放到 await 后。

**回答要点**：区分该 API 与回调提供的 onCleanup，讲清注册时机和请求取消。
