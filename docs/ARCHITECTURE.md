# 架构设计

## 分层

| 层次 | 位置 | 职责 |
| --- | --- | --- |
| 页面与状态 | ai-interview/src/pages、contexts、hooks | 收集输入、流式显示、草稿、请求身份与反馈 |
| 应用装配 | backend/app.js、server.js | 中间件、路由、静态资源、启动与关闭 |
| HTTP | backend/routes | 输入输出、状态码、SSE、请求关闭信号 |
| 业务流程 | services/questionPlan.js、questionFlow.js、evaluationFlow.js | 选题、检索、模型、校验与保存 |
| 模型传输 | services/aiService.js | HTTP 参数、messages、JSON Mode、完成状态与截止时间 |
| 契约 | services/aiContract.js、dataValidation.js | 字段、ID、权重、证据、引用与保存数据检查 |
| 数据访问 | services/mysqlStore.js、knowledge/repository.js | 参数化 SQL、事务、查重、记录与知识存储 |
| 知识推理 | services/knowledge、workers/localEmbedding.js | 资料切片、本地向量化、检索与快照 |

当前没有 ORM、LangChain、多 Agent 或独立向量服务。保持普通函数和明确依赖，便于学习与测试。

## 出题

1. 前端传分类、知识点、题型、难度与近期标题。
2. 后端先校验输入，按范围、近期使用与薄弱统计生成计划。
3. 可选检索使用分类、知识点、版本与题型过滤，再计算向量相似度。
4. Prompt 要求题干、Rubric 与参考答案；流式输出只提取标题/正文作预览。
5. 完整 JSON 通过契约、长度与查重后，在短事务中保存，再发送业务 done。

预览不代表成功。上游 finish_reason、JSON、业务校验、数据库保存与前端 done 是不同层次。

## 评分

前端只提交题目 ID、原答案和提交标识。后端读取已保存题目；缺规则的旧题先补齐，之后让模型按固定 Rubric 返回判定、证据与解释。

程序按权重计算：met 全分、partial 半分、missed/incorrect 零分，分项加总后取整。uncertain 使本次评估无效，不做权重归一化。JSON Mode 之外仍有手写结构与业务检查。

完整历史含原答案、成绩、分项、模型/Prompt 标签与题目快照，落库后才返回。前端只展示和刷新摘要，不重复写历史。

## 取消与并发

- 生成请求同时使用 AbortController、递增请求身份与范围比较；取消不保证已排队回调不执行。
- 评分切题只使旧结果不能打开当前弹窗，不主动取消后端正在保存的成绩。
- 同次提交先查持久化历史，完全相同可重放；当前进程用 WeakMap 合并在途任务，数据库唯一键兜底。
- 生成查重与保存按分类行锁串行化，LLM 请求在事务之外。
- 数据库死锁仅有限重试 SQL，不重做模型调用。

## RAG 的范围

Markdown 经元数据和切片校验后逐篇事务导入两张表。本地 E5 模型在单 Worker 中生成 384 维向量，MySQL JSON 保存向量，Node.js 对筛选候选计算余弦相似度。

新题冻结检索片段正文、内容哈希、版本与 rubricSources。评分 sourceIds 必须属于本项固定允许来源。它验证引用集合和一致性，不验证技术断言的语义蕴含。

知识更新不会改写旧历史正文快照，但事实卡与完整 Prompt 文本没有单独冻结，所以不构成全部模型输入的精确重放。

## 已知限制

| 限制 | 影响 |
| --- | --- |
| evidence 比较使用 NFKC 并去空白 | 代码字符串内部空白变化可能被错误接受，不是严格原文验证 |
| 正文指纹也去空白 | 可能将语义不同的代码题合并；修复需考虑已有指纹迁移 |
| partial、题干与规则一致性主要依赖 Prompt | 结构校验不能证明评分语义正确 |
| 旧题补规则没有独立格式修复循环 | 补齐失败不由后续评分循环修复 |
| 保存失败后没有持久化模型结果待写缓存 | 后续重新提交仍可能再次产生模型费用 |
| SSE 未按 write=false 等待 drain | 没有完整下游背压；也没有续传和事件缓存 |
| 单 Worker 与范围候选上限 | 面向本地小规模知识库，没有大规模容量保证 |
| 没有登录和资源归属 | 多浏览器共享同一个后端训练数据，不能直接公网多人使用 |

这些限制公开保留，不因测试通过而被视为已修复。深入代码走读见[完整链路审阅](PROMPT_PIPELINE_AND_SCORING_AUDIT.md)。
