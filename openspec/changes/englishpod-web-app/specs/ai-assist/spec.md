## ADDED Requirements

### Requirement: AI 单词解析
系统 SHALL 在用户请求时调用 LLM 生成单词在当前语境中的含义、常见搭配与 2-3 个例句，响应时间目标低于 2 秒。

#### Scenario: 请求单词详解
- **WHEN** 用户在释义卡片点击「AI 详解」
- **THEN** 系统携带当前句语境调用 LLM 并展示语境含义、搭配与例句

### Requirement: AI 句子解析
系统 SHALL 对选中的句或段进行语法结构分析、中文翻译、重点词汇标注与文化背景补充。

#### Scenario: 请求句子解析
- **WHEN** 用户选中一句或一段并请求解析
- **THEN** 系统返回语法分析、翻译与重点词标注

### Requirement: AI 对话练习
系统 SHALL 基于当前课程话题提供简单的 AI 对话练习场景。

#### Scenario: 开始对话练习
- **WHEN** 用户在某课进入对话练习
- **THEN** 系统基于该课话题发起对话并对用户输入做出回应

### Requirement: AI 后端配置
系统 SHALL 支持配置兼容 OpenAI 的 LLM 后端（含本地 Ollama），API Key 可经环境变量或设置页管理。

#### Scenario: 配置 LLM
- **WHEN** 用户在设置页填写 API 地址、Key 与模型
- **THEN** 配置被按用户保存，后续 AI 调用使用该配置

### Requirement: 本地词典降级
系统 SHALL 在 AI 服务不可用时将单词查询降级为本地内嵌词典并提示用户。

#### Scenario: AI 不可用
- **WHEN** LLM 调用失败或超时
- **THEN** 单词卡片改用本地词典数据并显示「AI 服务暂不可用」
