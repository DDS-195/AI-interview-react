---
title: "Git bisect 定位回归"
sourceKey: "official-notes-v1:engineering:git-bisect:Git bisect 定位回归"
categoryId: "engineering"
topicIds: ["engineering:git-bisect"]
technicalVersion: "现代浏览器，ECMAScript 2023；涉及其他库时需明确版本"
sourceUrl: "https://git-scm.com/docs/git-bisect"
sourceKind: "curated"
kind: "concept"
aliases: ["git-bisect"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## Git bisect 定位回归

**原理**：bisect 在已知好版本与坏版本之间缩小范围，通过可重复验证找到引入问题的提交。

**常见误区**：验证结果不稳定或选错好坏边界会得到错误结论；不便验证的提交可跳过。

**回答要点**：说明复现条件、好坏标记、自动验证与结束后恢复工作位置。
