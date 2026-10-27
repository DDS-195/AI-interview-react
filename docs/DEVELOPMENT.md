# 开发与故障排查

## 环境与首次启动

推荐 Node.js 24 和 MySQL 8.0.19+。根目录 `.nvmrc` 给出推荐 Node 主版本，三个 package.json 记录最低要求。

~~~sh
npm run setup
~~~

复制 `backend/.env.example` 为 `backend/.env`，配置本机数据库与 LLM，然后执行：

~~~sh
npm run db:setup
npm run dev
~~~

开发页面使用 `5173`，API 使用 `3001`，Vite 按 `/api` 代理。开发脚本固定后端端口 3001，Ctrl+C 同时结束两端。修改后端源码后重新启动开发脚本。

`npm start` 会先构建，再从 Express 的 3001 端口提供页面与 API。`npm run build` 只构建，不启动服务。

## 配置

| 配置 | 作用 |
| --- | --- |
| AI_API_KEY | 后端模型密钥 |
| AI_API_BASE_URL | 模型基础地址，代码追加 /chat/completions |
| AI_MODEL | 请求模型标识，当前各 AI 任务共用配置 |
| PORT | 单独后端/构建后运行的监听端口 |
| MYSQL_HOST / MYSQL_PORT | 本机 MySQL 地址 |
| MYSQL_USER / MYSQL_PASSWORD | 数据库账号 |
| MYSQL_DATABASE | 项目数据库名 |
| MYSQL_CONNECTION_LIMIT | 连接池容量，默认 4 |
| RAG_MODE | off 关闭自动知识增强，prefer 尝试本地检索 |

环境在后端加载时读取，改动后需重启。前端不保存模型或数据库凭据。没有真实模型密钥时仍可运行普通自动测试；实际出题和评分需要有效服务。

## 检查命令

~~~sh
npm run format:check
npm run lint
npm test
npm run build
npm run check
~~~

完整入口 `check` 依次执行格式、Lint、前端测试、后端测试、类型构建及 JS gzip 预算。前端使用 Vitest 与 Testing Library；后端使用 Node.js test runner、模拟 AI 和真实临时 MySQL。

临时库随机命名并在结束时清理，只针对本次创建的库。账号需要建库/删库权限；不会把正式训练库当作清理目标。CI 使用自己的 MySQL 服务，不连接开发机数据。

只执行某一端：

~~~sh
npm --prefix ai-interview test
npm --prefix backend test
~~~

默认练习页的入口和静态 JS 依赖 gzip 总量预算为 450 KiB；这是体积门槛，不是 FCP/LCP 或页面耗时指标。

### Windows 临时目录限制

如果 Vitest 在收集测试前因默认临时目录的 `EPERM` 失败，可在当前终端使用项目缓存目录，不必修改业务代码：

~~~powershell
New-Item -ItemType Directory -Force backend/.cache/vitest-temp | Out-Null
$env:TEMP = (Resolve-Path backend/.cache/vitest-temp).Path
$env:TMP = $env:TEMP
npm --prefix ai-interview test
~~~

该设置只影响当前终端，缓存不提交 Git。

## 显式 AI 与 RAG 检查

~~~sh
npm --prefix backend run test:ai -- --output .cache/quality-result.json
npm --prefix backend run test:ai -- --generation-only
npm run test:rag
npm run test:rag -- --ai
~~~

- `test:ai` 使用真实模型和合成题目，消耗额度；当前 4 道题、20 个案例、4 次生成，Axios 调用保护上限 48 次。
- `--generation-only` 跳过评分案例。
- `test:rag` 使用本地缓存模型与临时库，验证导入、索引和代表性检索，不调用聊天模型。
- `test:rag -- --ai` 额外调用真实出题与评分，消耗额度。

质量脚本的合成通过率不是全领域准确率。重复评分实验要生成新提交标识，避免将旧成绩重放误当成模型稳定。

## 数据与迁移

当前长期数据在 MySQL。回答草稿、当前选择和主题在浏览器中，同一后端的多个浏览器共享训练库，但不共享草稿与主题。

从旧版本升级时先停止旧服务：

~~~sh
npm run db:migrate
~~~

优先读取旧 SQLite，否则读取旧 JSON；工具先生成备份，并将数据与迁移标记一起提交，原文件保留。细节及手动指定来源见[数据库说明](../backend/database/README.md)。

若确实从旧七表 RAG 版本升级，先备份并停止服务，再执行 `npm run knowledge:migrate`。新克隆仓库不需要执行旧数据迁移命令。

## 常见问题

| 现象 | 排查 |
| --- | --- |
| MySQL 初始化失败或 /api/health 返回 503 | 启动 MySQL，检查连接参数、建库权限并执行 db:setup |
| 3001 或 5173 被占用 | 结束此前的项目进程；开发代理固定指向 3001 |
| AI 返回 401/402/429 等错误 | 核对密钥、服务商额度、请求频率和模型；不要把真实凭据贴进 Issue |
| 模型接口 404 | 检查基础地址是否包含服务商要求路径，避免重复或漏掉 /v1 |
| 有预览但最终失败 | 查看业务 error/done；输出截断、契约无效或保存失败都不算生成成功 |
| 知识增强未生效 | 先下载模型、执行 knowledge:setup、重启服务，再查 knowledge:status |
| 资料导入正常但索引失败 | 字符长度不等于 token；按完整知识单元缩短超过 512 tokens 的片段 |
| 刷新后草稿没恢复 | 草稿依赖当前 origin 的本地存储；不同端口和浏览器不是同一存储空间 |

安全边界见[安全说明](../SECURITY.md)，模型判断与已知代码限制见[架构设计](ARCHITECTURE.md)。
