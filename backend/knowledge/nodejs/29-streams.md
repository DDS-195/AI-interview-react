---
title: "流的背压"
sourceKey: "starter-v1:nodejs:streams:流的背压"
categoryId: "nodejs"
topicIds: ["nodejs:streams"]
sourceUrl: "https://nodejs.org/docs/latest-v22.x/api/stream.html"
sourceKind: "curated"
kind: "concept"
technicalVersion: "Node.js 22+"
aliases: ["流的背压"]
licenseNote: "原创简要笔记，所附官方来源用于事实核对"
---

Writable.write 返回 false 表示生产者应暂停继续写入,等待 drain 后再继续,以避免无界积累。流的高水位是缓冲阈值,不能一概等同于绝对的内存上限。
