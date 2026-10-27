# 本地MySQL存储

本项目使用MySQL 8.0.19+，当前本机验证版本为8.0.40。采用mysql2的Promise连接池和原生SQL，便于学习表结构、查询、索引、外键和事务。数据库配置放在后端私有的 `.env`，前端不接触连接账号。

## 启动与迁移

在项目根目录执行：

```sh
npm run db:setup
npm run db:migrate
npm run dev
```

`db:setup`根据 `MYSQL_DATABASE` 创建专用数据库与表，可以重复执行。新的空项目无旧数据时跳过 `db:migrate`。此前SQLite项目需要先停止旧后端；迁移工具只读旧文件，迁移前保存JSON备份，并在MySQL事务中提交完整数据和迁移标记。重复迁移不复活已经删除的记录；失败可以修复问题后重试。

迁移指定备份文件时，在后端目录执行 `npm run db:migrate -- 路径/备份.json`（也支持 `.sqlite`）。同一次升级完成后，额外备份使用数据API导入，避免绕过迁移完成标记。

日常使用 `npm run dev` 或 `npm start`，保持本机MySQL服务运行。`GET /api/health`会实际查询数据库，成功响应包含数据库类型与名称；连接或数据访问失败返回503，不将失败伪装成成功保存。

## 分层与表结构

请求流程为：前端 → 路由校验 → 出题/评分业务服务 → `services/mysqlStore.js` → `database/mysql.js` → MySQL。

| 文件 | 职责 |
| --- | --- |
| `config.js` | 读取配置，验证数据库名、端口和连接数 |
| `mysql.js` | 连接池、建库、建表与事务提交/回滚 |
| `schema.sql` | 完整可读的建表SQL |
| `../services/mysqlStore.js` | 查询、分页、保存、关联、查重及导入 |
| `../services/learningRepository.js` | 题库筛选、复习状态、最近成绩与学习统计 |
| `legacyData.js` | 一次性只读SQLite/JSON迁移，不参与日常存储 |
| `temporaryDatabase.js` | 为回归测试和模型检查创建独立随机数据库 |

| 表 | 内容 |
| --- | --- |
| `questions` | 题目、分类、正文、难度、答案类型、查重哈希与扩展详情 |
| `favorites` | 收藏题目ID、原始收藏时间和用于排序的UTC时间 |
| `history` | 回答、分数（含0分）、反馈、参考答案和完整评分详情 |
| `metadata` | 表结构版本和迁移完成标记 |
| `generation_locks` | 同一分类生成时的事务锁，防止并发保存重复题 |
| `review_marks` | 人工复习状态及标记时的最近评分ID，外键关联题目 |
| `rag_documents` | Markdown知识原文、分类、知识点、技术版本与来源 |
| `rag_chunks` | 文档切片与本地Embedding向量，JSON列直接保存向量 |

知识增强使用两张表，资料导入与向量化通过脚本完成。完整链路和建议阅读顺序见 [RAG学习说明](../KNOWLEDGE.md)。

业务ID保留，内部自增 `rowId` 用于稳定排序。收藏与历史通过 `questionId` 外键关联题目。各表使用InnoDB和utf8mb4，兼容中文与emoji。原始时间字符串保持不变，另存UTC时间用于排序。题目的知识点通过JSON生成列提取，便于按分类查询出题覆盖。

评分细项、参考来源、知识点ID、技术版本等随完整记录保存在 `details` JSON列。API会合并这些字段，前端格式保持不变。所有外部输入使用参数化查询；表名仅由固定内部逻辑选择。写入失败回滚，业务冲突返回409；死锁最多重试两次数据库事务，不重新调用模型。

## 用现有数据练习SQL

题库接口为 `GET /api/data/questions`，复习列表为 `GET /api/data/reviews`，学习概览为 `GET /api/data/learning`。列表支持分页、关键词、分类、知识点、题型、难度和作答状态筛选；分类别名保留兼容，关键词按字面匹配完整正文。

复习规则：每题最近一次有效评分低于80分进入待复习；人工标记可加入未作答或高分题。人工完成只作用于标记时的评分，新一次低分会重新进入待复习；重练达到80分自动完成。未评分记录不覆盖已有成绩，首次/最近成绩与进步均从历史计算，删除历史后随之重算。人工状态也随数据API导出、导入保留，旧备份无需新增字段。

学习统计区分已生成题目、已作答题目、总作答次数、已评分次数、每题最近平均分和知识点覆盖。覆盖按注册表的知识点去重，未归类旧题不猜测知识点；成绩趋势按北京时间汇总最近14个作答日。查询通过CTE、窗口函数、关联与聚合完成，不逐题查询或在浏览器下载所有回答。启动时自动补建复习表，原有题目和历史不受影响。

连接MySQL后选择项目数据库：

```sql
USE ai_frontend_interview;
SHOW TABLES;
DESCRIBE questions;

-- 各分类已生成的题目数量
SELECT categoryId, COUNT(*) AS total
FROM questions
GROUP BY categoryId
ORDER BY total DESC;

-- 最新题目以及JSON中的出题版本
SELECT id, title, topic,
       JSON_UNQUOTE(JSON_EXTRACT(details, '$.technicalVersion')) AS technicalVersion
FROM questions
ORDER BY rowId DESC
LIMIT 10;

-- 答题历史与题目关联，0分也会保留
SELECT q.title, q.categoryId, h.score, h.submittedAt
FROM history h
JOIN questions q ON q.id = h.questionId
ORDER BY h.submittedOrderAt DESC, h.rowId DESC
LIMIT 10;
```

## 备份与测试

完整JSON导出地址：`http://127.0.0.1:3001/api/data/export`；导入接口为 `POST /api/data/import`，会保留已有同ID记录，缺失关联题目时整批回滚。

MySQL命令行整库备份示例（使用密码提示，不把密码写进命令）：

```sh
mysqldump -h 127.0.0.1 -P 3306 -u root -p --single-transaction --result-file=interview-backup.sql ai_frontend_interview
```

恢复整库时先停止项目，选择空的恢复数据库后使用MySQL客户端导入备份SQL，确认记录完整再修改配置或恢复启动。旧SQLite及 `before-mysql-*.json` 是迁移备份，后端正常运行不再修改它们。

`npm run check`中的后端测试使用本机真实MySQL、模拟AI响应；测试数据库名以 `ai_interview_test_` 开头并带随机标识。模型质量检查使用 `ai_interview_quality_` 前缀；测试只删除本次自行创建的库，拒绝清理正式库，账号需要创建与删除测试库的权限。

实现参考：[MySQL2连接池与参数化查询](https://sidorares.github.io/node-mysql2/docs)、[MySQL InnoDB事务](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-transaction-model.html)、[MySQL JSON类型](https://dev.mysql.com/doc/refman/8.0/en/json.html)。
