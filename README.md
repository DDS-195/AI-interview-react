# AI前端面试助手

[![Code checks](https://github.com/DDS-195/AI-interview-react/actions/workflows/check.yml/badge.svg)](https://github.com/DDS-195/AI-interview-react/actions/workflows/check.yml)
![React](https://img.shields.io/badge/React-18-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/MySQL-8-4479a1?logo=mysql)

基于 **React + TypeScript + Express + MySQL** 的技术面试训练项目，面向前端学习者与求职者。

选择技术方向，生成题目，提交文字或代码答案，再根据逐项评分、参考要点与历史记录进行复习。LLM 负责逐项判断，后端负责契约校验、权重计分与保存；可选的本地 RAG 为题目提供可追溯的知识依据。

**当前版本在本机运行。** 训练数据存本机 MySQL，出题和评分仍需要可用的 LLM API，知识向量由本地模型生成。仓库不再包含此前腾讯云部署配置。

[快速开始](#快速开始) · [工作原理](#工作原理) · [文档](#文档) · [参与贡献](CONTRIBUTING.md)

## 功能

| 模块 | 已实现能力 |
| --- | --- |
| 分类与练习 | 二级分类、知识点、难度筛选；理论、场景、手写代码、代码排错 |
| 流式出题 | Fetch + SSE 增量预览、打字机效果、请求取消与过期响应隔离 |
| 结构化评价 | 固定 Rubric、逐项判定、回答证据、解释、建议与参考要点 |
| 题库与复习 | 生成题库、收藏、历史详情、错题复习与手动标记 |
| 学习概览 | 练习统计、成绩趋势、知识点覆盖与薄弱考点推荐 |
| 知识增强 | Markdown 笔记、本地 Embedding、MySQL 向量存储、知识快照与引用绑定 |
| 双端体验 | 桌面与移动布局、明暗主题、按题目保存回答草稿 |

目录包含 **24 个分类、468 个知识点**；当前 **165 份原创笔记覆盖 131 个知识点**。知识点是出题范围，不是固定题目数或全部已有资料。详见[知识库覆盖记录](docs/知识库覆盖记录.md)。

前端使用 React 18、TypeScript、Vite、React Router、Ant Design、CodeMirror 6 与按需 ECharts；后端使用 Express、Axios、mysql2、Transformers.js。质量检查由 ESLint、Prettier、Vitest、Node.js test runner 与 GitHub Actions 组成。

## 快速开始

### 1. 准备环境

- **Node.js 24**（推荐，与 CI 一致；最低 22.13.0）及 npm。
- **MySQL 8.0.19 或更高版本**，启动本机 MySQL 服务。
- 兼容 `/chat/completions` 的模型 API 账号，以下以 DeepSeek 为例。

MySQL 账号需能够创建项目数据库和表。后端测试还需要创建、删除独立测试库的权限；测试不会删除正式训练库。

### 2. 获取代码与安装依赖

~~~sh
git clone https://github.com/DDS-195/AI-interview-react.git
cd AI-interview-react
npm run setup
~~~

### 3. 配置后端

复制 `backend/.env.example` 为 `backend/.env`：

~~~powershell
# Windows PowerShell
Copy-Item backend/.env.example backend/.env
~~~

~~~sh
# macOS / Linux
cp backend/.env.example backend/.env
~~~

填写模型密钥与本机数据库连接：

~~~dotenv
AI_API_KEY=your-api-key-here
AI_API_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat
PORT=3001
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=your-mysql-user
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=ai_frontend_interview
MYSQL_CONNECTION_LIMIT=4
RAG_MODE=off
~~~

代码会在模型基础地址后追加 `/chat/completions`，请按服务商要求保留基础路径。**密钥只由后端读取，不要放入前端变量、截图或 Git 提交。**

首次运行建议 `RAG_MODE=off`，先完成基本训练流程；知识增强之后单独启用。

### 4. 建库并启动

~~~sh
npm run db:setup
npm run dev
~~~

打开 [http://127.0.0.1:5173](http://127.0.0.1:5173)。Vite 将 `/api` 转发到本机 `3001`，Ctrl+C 同时停止前后端。后端启动先检查数据库；修改后端源码后需重新启动开发脚本。

构建后运行：

~~~sh
npm start
~~~

该命令先构建前端，再由 Express 提供页面和 API，访问 [http://127.0.0.1:3001](http://127.0.0.1:3001)。服务默认绑定本机地址。

## 工作原理

~~~mermaid
flowchart TD
  A["选择分类、知识点、题型与难度"] --> B["后端形成选题计划"]
  B --> C{"是否启用知识增强"}
  C -->|是| D["范围过滤 → 本地向量检索"]
  C -->|否| E["构建出题 Prompt"]
  D --> E
  E --> F["LLM 流式生成题目与 Rubric"]
  F --> G["前端预览标题和题干"]
  F --> H["完整校验、查重与保存"]
  H --> I["业务完成 → 用户回答"]
  I --> J["读取保存的规则与知识快照"]
  J --> K["LLM 返回逐项判定和证据"]
  K --> L["程序校验、按权重计分"]
  L --> M["保存完整历史 → 展示反馈 → 复习"]
~~~

- 出题同时保存题干、必要评分项、固定权重、可选拓展与参考答案。
- 模型返回 `verdict / evidence / explanation`，后端按 `met=100%`、`partial=50%`、`missed/incorrect=0%` 汇总权重，最后取整。
- `uncertain` 或无效输出不生成有效成绩；符合条件时最多修复重试一次。
- 完整历史先保存再返回；同次提交可重放已保存成绩，未保存的重试仍可能再次调用模型。

### 可选：启用本地知识增强

~~~sh
npm run knowledge:download
npm run knowledge:setup
~~~

首次下载本地向量模型并导入资料、建立索引；准备成功后工具会把 `RAG_MODE` 设置为 `prefer`，服务需重启读取配置。模型不需要 Docker、GPU 或独立向量服务器。

资料位于 `backend/knowledge/`，修改后执行 `npm run knowledge:import` 和 `npm run knowledge:index`。向量存在 MySQL JSON 列，过滤范围后在 Node.js 计算余弦相似度。

资料缺失或局部向量推理不可用可回退常规出题；数据库读取失败、用户取消有独立处理。删除文件不会自动删库。详见 [RAG 学习说明](backend/KNOWLEDGE.md)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run setup` | 安装根目录、前端和后端依赖 |
| `npm run dev` | 同时启动本地开发服务 |
| `npm run build` / `npm start` | 构建 / 构建后启动页面与 API |
| `npm run check` | 格式、Lint、前后端测试、构建与体积预算 |
| `npm run format` / `npm run format:check` | 整理 / 检查代码排版 |
| `npm run db:setup` / `npm run db:migrate` | 建库 / 从旧 SQLite、JSON 迁移 |
| `npm --prefix backend run knowledge:status` | 查看索引状态 |
| `npm run test:rag` | 用临时库验证真实本地模型检索 |
| `npm --prefix backend run test:ai` | 真实 LLM 合成样本检查，**消耗额度** |

普通前后端测试使用模拟模型与临时 MySQL，不调用付费 LLM。真实检索需要本地模型缓存；`npm run test:rag -- --ai` 额外调用真实 LLM。详见[开发指南](docs/DEVELOPMENT.md)。

## 目录

~~~text
ai-interview/          React 页面、组件、状态、请求工具和前端测试
backend/
  database/            MySQL 配置、schema、事务和迁移
  knowledge/           原创技术笔记及参考来源
  prompts/             出题、规则补齐和评分 Prompt
  routes/              AI、数据与知识 HTTP 接口
  services/            业务流程、模型传输、契约和仓储
  test/                后端测试
  workers/             本地 Embedding 推理
shared/catalog.json   前后端共享的分类、知识点、版本和题型
scripts/              本地启动、构建压缩和体积检查
docs/                 使用、开发、学习与审阅文档
.github/              检查工作流和协作模板
~~~

## 文档

- [文档导航](docs/README.md)
- [开发与故障排查](docs/DEVELOPMENT.md)
- [架构设计](docs/ARCHITECTURE.md)
- [API 说明](docs/API.md)
- [数据库说明](backend/database/README.md)
- [RAG 学习说明](backend/KNOWLEDGE.md)
- [变更记录](CHANGELOG.md) · [贡献指南](CONTRIBUTING.md) · [安全说明](SECURITY.md)

## 当前边界

- AI 评分与参考答案可能出错，合法 JSON 和引用 ID 不证明技术结论正确。
- 代码答案只做阅读分析，没有执行沙箱。
- 证据比较和正文指纹存在空白归一化的已知限制，见[架构文档](docs/ARCHITECTURE.md#已知限制)。
- 没有登录、JWT、RBAC 或多用户隔离；本地来源检查不是身份认证。
- SSE 没有自动重连、断点续传和完整下游背压控制，面向本地小规模使用。
- 能力概览是练习统计与规则推荐，没有大样本校准的能力测量。

## 使用与授权

本仓库目前**未指定开源许可证**。如需复用或分发，请先与维护者沟通；第三方依赖遵循各自许可证。知识笔记为原创整理，来源链接用于核对，具体说明保存在各篇资料中。
