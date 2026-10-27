---
title: "script setup 的公开接口"
sourceKey: "official-notes-v1:vue:expose:script setup 的公开接口"
categoryId: "vue"
topicIds: ["vue:expose"]
technicalVersion: "Vue 3 Composition API"
sourceUrl: "https://cn.vuejs.org/api/sfc-script-setup.html"
sourceKind: "curated"
kind: "concept"
aliases: ["expose"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## script setup 的公开接口

**原理**：script setup 的组件实例默认封闭，defineExpose 显式声明供父级模板引用访问的接口。

**常见误区**：父组件不应依赖子组件全部内部变量；defineExpose 应在 await 之前调用。

**回答要点**：用最小公开方法表达命令式能力，普通数据流继续使用 props 与事件。
