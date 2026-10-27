# API 说明

所有路径相对本机服务，默认 `http://127.0.0.1:3001`。数据响应为 JSON，流式生成例外。当前没有用户认证或数据隔离，不应直接公开为多人接口。

接口可修改本机训练数据；下列示例仅说明协议，不会自动执行。

## 健康与生成

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/health | 检查数据库与本地服务 |
| POST | /api/ai/generate-question | 普通生成，成功后返回已保存题目 |
| POST | /api/ai/generate-question-stream | SSE 预览与业务完成 |
| POST | /api/ai/evaluate-answer | 普通 JSON 评分；保存完整历史后返回 |

### 生成请求

~~~json
{
  "category": "react",
  "topicId": "react:effects",
  "mode": "theory",
  "difficulty": "easy",
  "existingTitles": []
}
~~~

category 必填；topicId、mode、difficulty、existingTitles 可省略。知识点必须属于分类并支持当前模式；mode 为 theory/scenario/coding/debug，difficulty 为 easy/medium/hard。

生成需要可用模型并可能消耗额度。服务端确定的题目包含 ID、分类、题干、难度、Rubric、参考答案和版本；知识增强题还包含快照与来源绑定。

### SSE 协议

响应类型为 `text/event-stream`。每条事件采用单行 JSON data，并以空行结束：

~~~text
data: {"content":"","fullContent":"正在生成的标题和题干预览"}

data: {"done":true,"title":"题目标题","body":"题目正文","difficulty":"easy","topic":"useEffect","question":{...}}
~~~

这是事件结构说明，question 省略内容不是可直接执行的完整 JSON。正常完成的 question 是已校验和保存的题目。预览可能重置，不能当成已保存内容；仅连接关闭或 HTTP 200 都不代表成功。

发头前的输入错误使用普通 HTTP JSON 错误；发头后使用 `data: {"error":"错误提示"}` 并结束。当前不实现 event/id、多行 data、自动重连或续传语义。

### 评分请求

~~~json
{
  "questionId": "已保存题目的ID",
  "answer": "候选人的原始文字或代码",
  "submittedAt": "2026-10-27T00:00:00.000Z"
}
~~~

questionId、非空 answer 必填；answer 最多 30000 个字符串长度单位。submittedAt 可省略，提供时须为规范 ISO 时间字符串，作为同次提交标识。

前端失败重试应对同题同答案复用标识；正常重新练习使用新标识。相同标识配不同答案返回 409。

结果包含：

| 字段 | 来源 |
| --- | --- |
| score | 后端按保存权重加总并取整 |
| criteria | 每项 id、description、maxPoints、points、verdict、evidence、explanation |
| suggestions / uncertainties | 模型建议与待核对事项 |
| feedback | 程序生成的分项统计摘要 |
| correctAnswer | 保存题目的参考答案 |
| referenceStatus / sources | 题目参考来源标签与链接 |
| knowledgeSnapshot | 可选的固定知识依据 |
| promptVersion / questionPromptVersion / model | 评分/题目的版本标签与响应模型 |
| submittedAt | 已保存的提交标识 |

grounded 分项另含 sourceIds。uncertain 不生成有效成绩；uncertainties 数组非空不是同一概念。代码答案只做阅读分析。

## 训练数据

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/data | 数量与收藏摘要 |
| GET | /api/data/questions | 题库筛选与分页 |
| GET | /api/data/questions/:id | 完整题目 |
| GET | /api/data/reviews | 复习列表 |
| PUT | /api/data/reviews/:id | 标记 pending/completed |
| GET | /api/data/learning | 学习概览，可按 categoryId |
| GET | /api/data/history | 历史摘要分页 |
| GET | /api/data/history/:submittedAt | 完整历史及题目快照 |
| GET | /api/data/favorites | 收藏摘要分页 |
| POST | /api/data/favorites/toggle | 切换收藏，body 为 questionId |
| DELETE | /api/data/favorites/:id | 删除单条收藏 |
| DELETE | /api/data/favorites | 清空收藏 |
| DELETE | /api/data/history/:submittedAt | 删除一条历史 |
| DELETE | /api/data/history | 清空历史 |
| GET | /api/data/export | 导出完整训练数据 |
| POST | /api/data/import | 校验后合并导入数据 |

收藏与历史分页参数为 page、pageSize，pageSize 最大 100。题库支持 categoryId、topicId、mode、difficulty、keyword 等筛选，以当前校验器为准。

保留的 `PUT /api/data/questions/:id` 和 `POST /api/data/history` 为通用保存入口，不能把其导入记录视为一定经过 AI 实时评分；当前生成和评分流程已自行保存。

## 知识

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/knowledge/status | 文档与向量索引状态 |
| GET | /api/knowledge/documents | 全部资料摘要，页面负责筛选与分页 |
| GET | /api/knowledge/documents/:id | 文档正文和元数据 |
| POST | /api/knowledge/search-preview | 按 categoryId、topicId、query 与可选版本/题型检索 |

HTTP 不提供知识导入和索引写入；由本机脚本显式执行，参见 [RAG 学习说明](../backend/KNOWLEDGE.md)。

## 错误与限制

普通错误形如 `{ "error": "中文提示" }`。常见状态包括 400 输入无效、403 来源不允许、404 记录不存在、409 提交冲突/重复、413 内容过大、429 限流、502 模型或输出无效、503 数据服务不可用、504 部分模型超时。

不同取消/总截止时间不保证统一映射成 504。前端须同时处理 HTTP 状态、JSON 读取与 SSE 业务终态，不应凭错误文本猜测是否已保存。安全边界见 [SECURITY](../SECURITY.md)。
