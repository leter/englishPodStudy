## Why

现有 365 节 EnglishPod 课程资源（音频、英文 SRT、PDF 讲义）散落在文件系统中，缺少一个把"听课→查词→收藏→复习"整合成闭环的学习工具。本变更交付一个自托管的 Web 应用，最大化已有内容价值，并为未来开源（含多用户）预留架构空间。

## What Changes

- 新建一个 React SPA + Node/Hono 后端 + SQLite 的全栈 Web 应用，单 Docker 镜像部署。
- 新增**离线预处理工具**（Python）：用 LLM 把英文 SRT 逐句翻译为中文、产出双语字幕 JSON，并生成 365 课的 `manifest.json`；逐词时间戳（WhisperX）作为可选后置增强。
- 课程列表 + 一体化学习页（音频播放器、句级字幕同步、字幕模式切换、单句循环、单词点击查询、PDF 内嵌）。
- 生词本 + 基于 SM-2 的间隔重复复习（闪卡、自评评分、每日待复习提醒）。
- 学习进度持久化、仪表盘（统计 + 热力图 + 继续学习）、AI 辅助解析（单词/句子/对话，含本地词典降级）。
- 跟读发音练习（Web Speech API）、数据导出/导入。
- 数据从第一天起按 `user_id` 隔离，认证做成开关（`AUTH_ENABLED`）：MVP 单用户体验，开源时开启即多用户带账户密码，**无数据迁移**。

## Capabilities

### New Capabilities
- `content-preprocessing`: 离线管线——英文 SRT 经 LLM 翻译产出双语字幕 JSON、生成课程 manifest、可选 WhisperX 逐词时间戳。
- `course-library`: 课程列表/筛选/状态展示，课程元数据与静态资源（音频/PDF/字幕）服务与 manifest 索引。
- `audio-subtitle-sync`: 音频播放控制、句级字幕实时高亮与自动滚动、字幕模式切换、单句循环、单词点击查询。
- `vocabulary-srs`: 单词/句子一键收藏、生词本管理、SM-2 间隔重复引擎、复习闪卡与自评评分。
- `learning-progress`: 播放进度与完成状态持久化、学习仪表盘、连续学习热力图、继续学习入口。
- `ai-assist`: AI 单词/句子语境解析、AI 对话练习、可配置 LLM 后端、AI 不可用时本地词典降级。
- `pdf-viewer`: 课程详情页内嵌 PDF 讲义查看（懒加载、缩放、翻页）。
- `shadowing`: 基于浏览器 Web Speech API 的跟读、文字差异对比与正确率评分。
- `user-accounts`: 数据按 `user_id` 隔离、可开关的注册/密码校验/会话认证层。
- `app-deployment`: 单 Docker 镜像 + docker-compose、Volume 挂载（content / sqlite）、数据导出/导入。

### Modified Capabilities
<!-- 全新项目，无既有 spec 需要修改 -->

## Impact

- **新代码库**：`apps/web`（前端）、`apps/server`（运行时后端）、`tools/preprocess`（离线 Python 工具）。
- **数据**：新增 SQLite schema（`users`/`progress`/`vocab`/`reviews`/`study_logs`/`settings`），单文件经 Volume 挂载。
- **静态资源**：现有 `englishpod365/`、`english_pod/{srt,pdf,txt}/` 经预处理产出 `content/` 目录，Volume 挂载只读。
- **外部依赖**：LLM API（OpenAI 兼容 / Ollama）用于翻译与运行时 AI；WhisperX 3.3.2（仅离线、需 GPU）；浏览器 Web Speech API（跟读）。
- **运维**：Docker 镜像目标 <500MB（运行时不含 Python/ML 依赖）。
