---
title: "检索资料的指令边界"
sourceKey: "official-notes-v1:ai-apps:prompt-injection:检索资料的指令边界"
categoryId: "ai-apps"
topicIds: ["ai-apps:prompt-injection"]
technicalVersion: "通用LLM应用；模型与协议版本在题干中明确，不假定供应商专有API"
sourceUrl: "https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html"
sourceKind: "curated"
kind: "concept"
aliases: ["prompt-injection"]
licenseNote: "根据官方文档原创整理，来源用于核对；核对日期：2026-10-12"
---

## 检索资料的指令边界

**原理**：检索片段和用户文本都是不可信输入，应标注资料边界并限制其改变系统规则的能力。

**常见误区**：资料里出现命令不代表应执行；模型提示约束也不能代替输出校验和工具权限控制。

**回答要点**：说明输入分区、输出检查、最小能力和恶意引用的处理。
