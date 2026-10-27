---
title: "泛型约束与 keyof"
sourceKey: "starter-v1:typescript:generics:泛型约束与 keyof"
categoryId: "typescript"
topicIds: ["typescript:generics"]
sourceUrl: "https://www.typescriptlang.org/docs/handbook/2/generics.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "TypeScript 5.x"
aliases: ["泛型约束与 keyof"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

泛型表达输入与输出之间的类型关系。extends 约束允许安全使用约束中的成员,K extends keyof T 可以限制键来自对象 T;约束不意味着结果可任意替换成某个具体子类型。
