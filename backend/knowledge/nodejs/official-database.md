---
title: "MySQL 事务的提交与回滚"
sourceKey: "official-notes-v1:nodejs:database:MySQL 事务的提交与回滚"
categoryId: "nodejs"
topicIds: ["nodejs:database"]
technicalVersion: "Node.js 22+"
sourceUrl: "https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-model.html"
sourceKind: "curated"
kind: "concept"
aliases: ["database"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## MySQL 事务的提交与回滚

**原理**：事务把相关写入组合成提交或回滚单元，隔离与锁控制并发访问的可见性和竞争。

**常见误区**：多条 SQL 连续执行不代表已经在同一事务；事务与连接归属需一致。

**回答要点**：说明原子性、提交回滚、并发锁及异常后的连接释放。
