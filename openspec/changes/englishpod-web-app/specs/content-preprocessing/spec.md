## ADDED Requirements

### Requirement: 双语字幕生成
预处理工具 SHALL 读取每课的英文 SRT，调用 LLM 逐句翻译为中文，并输出包含英文、中文、起止时间戳的双语字幕 JSON 文件。

#### Scenario: 单课翻译
- **WHEN** 对某课运行翻译脚本且其英文 SRT 存在
- **THEN** 在 `content/<课号>/subtitles.json` 生成结构化双语字幕，每个条目含 `start`、`end`、`en`、`zh` 字段

#### Scenario: 断点续跑
- **WHEN** 批量翻译中途中断后重新运行
- **THEN** 已生成 `subtitles.json` 的课程被跳过，仅处理未完成课程，避免重复 LLM 调用

#### Scenario: SRT 格式异常容错
- **WHEN** 某课 SRT 时间戳缺失或格式损坏
- **THEN** 工具记录该课为异常并跳过，不中断整体批处理

### Requirement: 课程索引生成
预处理工具 SHALL 扫描课程资源目录并生成 `manifest.json`，作为 365 课的运行时索引。

#### Scenario: 生成 manifest
- **WHEN** 运行 manifest 生成命令
- **THEN** 输出 `content/manifest.json`，每课含 id、标题、时长、音频路径、PDF 路径、字幕路径

### Requirement: 可选逐词时间戳
预处理工具 SHALL 支持用 WhisperX 对音频做 forced alignment，产出逐词时间戳 JSON；该步骤为可选。

#### Scenario: 生成逐词时间戳
- **WHEN** 在 GPU 环境对某课运行对齐命令并以其文本转录为参考
- **THEN** 在 `content/<课号>/words.json` 输出每个单词的 `start`、`end`、`confidence`

#### Scenario: 跳过逐词处理
- **WHEN** 未运行对齐步骤
- **THEN** `words.json` 缺失，但 `subtitles.json` 与 manifest 仍完整可用
