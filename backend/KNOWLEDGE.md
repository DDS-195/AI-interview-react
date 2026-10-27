# 学习版 RAG

项目仍以面试训练为中心。RAG只负责提供相关技术资料，出题、rubric评分、历史、收藏和代码回答沿用原有流程。

## 先理解这条主线

```text
编辑 Markdown → 导入并切片 → 本地模型生成向量 → MySQL保存
用户选择考点 → 检索相关切片 → 放入提示词 → DeepSeek出题
用户回答 → 使用题目保存的资料和rubric → DeepSeek逐项判断 → 程序汇总分数
```

Embedding把文本转换成一组数字，用来比较语义。它不负责生成题目或评价回答。DeepSeek负责后两项。

## 建议阅读顺序

1. 打开 `knowledge/react/01-effects.md`，看一份知识资料。
2. 读 `services/knowledge/markdown.js` 和 `chunker.js`，理解文件如何变成切片。
3. 读 `services/knowledge/service.js`，重点看 `indexOnce` 和 `retrieve`。
4. 读 `similarity.js`，理解余弦相似度。
5. 读 `repository.js` 与 `database/knowledge-schema.sql`，学习两张表和对应SQL。
6. 读 `questionFlow.js`、`evaluationFlow.js`，看检索结果如何进入原有训练流程。

`localEmbedding.js` 与 `workers/localEmbedding.js` 封装本地模型推理，使用工作线程避免阻塞HTTP服务。学习主线时先把它看成“输入文本，输出向量”的工具即可。无需先掌握线程通信。

## 添加或更新资料

资料放在 `backend/knowledge/分类/文件名.md`。每个文件的格式：

```markdown
---
title: "Effect 清理"
categoryId: "react"
topicIds: ["react:effects"]
technicalVersion: "React 18，函数组件与Hooks"
sourceUrl: "https://react.dev/reference/react/useEffect"
kind: "concept"
---

这里写概念、常见误区与回答要点。代码使用完整的 Markdown 代码块。
```

分类与知识点须使用项目现有ID，技术版本须与出题背景匹配。需要时可以添加稳定的 `sourceKey`、`sourceKind`、`modes`、`aliases`；同一来源更新时保持标题与来源URL或sourceKey稳定。

修改文件后，在项目根目录执行：

```sh
npm run knowledge:import
npm run knowledge:index
```

重复导入不修改相同内容。正文或元数据变化时，事务更新原文并替换切片，新切片重新生成向量。脚本只处理缺少向量的切片；失败后修改资料再执行即可。启动服务不会自动导入或更新资料。删除文件不会自动删除数据库资料，避免误删；初学阶段优先修改已有文件或添加文件。

## 只用两张知识表

| 表 | 保存内容 |
| --- | --- |
| rag_documents | 原文、分类、知识点、技术版本、来源、内容校验值 |
| rag_chunks | 文档关联、片段正文、Embedding向量 |

向量保存在MySQL JSON字段；按分类、考点、版本、题型过滤后，在Node.js计算余弦相似度，选择最多5个相关片段。不使用专用向量数据库、混合排名、文档审核、后台索引任务或Agent。每个考点最多1000片，适合本地小型知识库。

模型固定为 `Xenova/multilingual-e5-small` 的384维量化版本。只需配置 `RAG_MODE=prefer`（开启）或 `off`（关闭）。首次执行 `knowledge:download`、`knowledge:setup`；模型已下载时不必重复下载。

## 评分与失败处理

新题保存实际检索片段、内容校验值和rubric引用，评分读取这份固定依据。资料更新不会改变旧题与历史的评分依据；两个内部版本字段只用于辨别快照，不提供版本管理页面。旧版hybrid/keyword快照仍可读取。

没有资料、向量尚未生成、模型故障或检索超时时，明确记录不可用状态，继续常规出题；用户取消请求时立即结束流程。代码不会执行用户答案。知识库不能保证模型判断绝对正确。

页面仅提供资料查看与检索体验，对应4个接口：`GET /status`、`GET /documents`、`GET /documents/:id`、`POST /search-preview`，前缀为 `/api/knowledge`。

学习概览只补充不同题目的分类平均分与样本数，薄弱知识点使用已有统计；不再提供多层能力推断与重复推荐。

## 旧版迁移与检查

此前7表版本先停止服务，再执行 `npm run knowledge:migrate`。工具把当前启用资料迁入两表，保留向量，核对训练数据；旧知识原文、所有历史版本和训练导出先备份到忽略的 `.cache/backups`。核对后清理旧7表。草稿、停用资料和旧版本保存在备份中，不自动参与新库检索；迁移工具只在升级时使用。

`npm run test:rag` 检查真实本地模型检索；`npm run test:rag -- --ai` 额外检查真实出题与评分。后者消耗模型额度，两者都使用临时数据库。普通 `npm run check` 使用模拟模型和真实临时MySQL。

当前165份资料附官方来源：保留初始34份笔记，补充131份原创整理。覆盖24个分类、131/468个知识点，Vue的25个现有考点均有资料，React覆盖23/31个考点。完整统计与待补清单见 [知识库覆盖记录](../docs/知识库覆盖记录.md)。资料按一个完整考点组织原理、误区与回答要点，保持简短；不直接镜像官方整页。`sourceKind=curated`表示原创整理，`sourceUrl`用于核对，版本与出题目录保持一致。

知识页面提供分类筛选、标题搜索及每页10份资料；列表接口只读取摘要字段，点开详情后才读全文。导入前校验整批文件的格式与切片，代码围栏错误会指出文件名。切片字符长度只是估计，本地模型实际限制是512 token；遇到上限需按完整知识单元缩短笔记，不能悄悄截断代码。`test:rag`对全部资料执行真实索引，并检查11个代表考点；`--ai`在临时数据库验证新增Pinia资料的出题与评分。
