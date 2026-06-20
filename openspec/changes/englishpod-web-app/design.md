## Context

已有 365 节 EnglishPod 课程资源：`englishpod365/<范围>/<课号>/` 内含主讲音频（`*pr.mp3`）、复习音频（`*rv.mp3`）、PDF；`english_pod/srt/` 有 365 个 Whisper 生成的**英文** SRT；`english_pod/txt/` 有纯文本转录；`english_pod/pdf/` 有 PDF 副本。需要把这些整合成一个自托管学习闭环，未来开源（含多用户）。完整背景见仓库根 `PRD.md` 与 `docs/superpowers/specs/2026-06-18-englishpod-design.md`。

关键约束：单用户/小社区规模；自托管 Docker；运行时镜像 <500MB；句级字幕同步 <200ms；前端交互密集；内容静态。

## Goals / Non-Goals

**Goals:**
- 把音频、双语字幕、PDF、生词本、SRS 复习整合为单一学习闭环。
- 预处理（重型 ML/翻译）与运行时彻底分离，保持运行时镜像轻量。
- 数据从第一天起按 `user_id` 隔离，认证可开关，单用户↔多用户无数据迁移。
- 一键 Docker 部署，课程资源与数据库经 Volume 挂载。

**Non-Goals:**
- 社交功能（评论/排行/好友）。
- 移动原生 App（仅响应式 Web）。
- 用户自行上传新课程内容。
- MVP 不做逐词卡拉 OK 高亮（作为可选后置增强）。

## Decisions

**1. 中文字幕走离线 AI 预生成（而非运行时翻译 / 不做中文）。**
现有 SRT 全英文。部署前用脚本批量调 LLM 逐句翻译，产出双语 JSON。运行时零延迟、零成本、可离线。代价是一次性预处理耗时与 token 费用。备选「运行时按需翻译」被否：首次打开有延迟、依赖 AI 可用、持续成本。

**2. 运行时用 TypeScript 全栈（Node + Hono），Python 仅留离线工具。**
运行时逻辑轻（CRUD + SM-2 + AI 转发），TS 全栈共享前后端类型、镜像更小。WhisperX（PyTorch/GPU/数 GB）与翻译脚本是一次性离线批处理，不进运行时镜像，从而满足 <500MB。备选「FastAPI 运行时」被否：把 Python+依赖带进运行时镜像，且无类型共享收益。

**3. 不在前端解析 SRT，运行时只消费预生成 JSON。**
解析/翻译/逐词时间戳都在离线一次性完成并容错；运行时只做时间匹配渲染，更稳更快。

**4. 句级同步用现有 SRT，逐词高亮（WhisperX）后置且可选。**
逐词需 GPU、需锁 WhisperX 3.3.2（3.3.3+ 有对齐回归）、需抽样校验，是全项目技术风险最高、收益边际的功能。前端从一开始按「`words.json` 缺失 → 降级句级」设计，后加零成本。

**5. SQLite + Drizzle ORM，数据按 `user_id` 隔离，认证开关化（`AUTH_ENABLED`）。**
单用户首选 SQLite（单文件、零配置、Volume 即备份）。所有用户数据表自带 `user_id`；MVP 预置默认用户 id=1、不显示登录页；开源时 `AUTH_ENABLED=true` 才启用注册/密码（argon2/bcrypt 哈希）/会话（HttpOnly Cookie）。表结构两模式相同，无迁移。真到数百并发，Drizzle 换 driver 到 Postgres + 索引即可。备选「数据存浏览器 IndexedDB」被否：绑死单设备、换设备/清缓存即丢、复习与统计本质是服务端查询。

**6. 部署：单 Docker 镜像（后端托管 SPA 静态产物）+ docker-compose，content 与 sqlite 走 Volume。**

**7. 数据落点。** 库内仅存用户产生的数据：`users`/`progress`/`vocab`/`reviews`(SM-2)/`study_logs`/`settings`；课程内容为静态文件不进库，`vocab` 只存引用（`lesson_id` + 音频时间戳）。

## Risks / Trade-offs

- **SRT 质量参差（时间戳偏移/格式不一）** → 离线阶段做校验与容错解析，异常课降级纯文本字幕，不阻塞音频。
- **逐词对齐精度（语速快/连读/背景音）** → 抽样校验；前端时间戳缺失自动降级句级；锁定 WhisperX 3.3.2。
- **AI 响应延迟/不可用** → loading 与超时处理；单词查询降级本地内嵌词典并提示。
- **预处理 token 成本** → 批处理脚本支持断点续跑与单课重跑，避免重复消费。
- **课程音频体积大** → 资源与镜像分离，Volume 挂载，按需加载不预载全部。
- **多用户扩展** → `user_id` 字段提前内建，认证层中间件强制按用户过滤；规模上限由 SQLite→Postgres 演进兜底。
- **跟读浏览器兼容** → Web Speech API 不支持时隐藏入口并提示。

## Migration Plan

全新项目，无既有系统迁移。部署步骤：
1. 离线：运行预处理工具（翻译→双语 JSON、生成 manifest；可选 WhisperX 逐词），产出 `content/` 目录。
2. 构建运行时 Docker 镜像，`docker compose up`，挂载 `./content`（只读）与 `./data`（sqlite 读写）。
3. 首启自动建表并 seed 默认用户（id=1），`AUTH_ENABLED=false`。
4. 回滚：停容器即可；数据为单一 sqlite 文件，升级前复制即备份。
5. 开源多用户：置 `AUTH_ENABLED=true`，无 schema 迁移。

## Open Questions

- 默认使用 `*pr.mp3` 主讲音频、暂不使用 `*rv.mp3` 复习音频 —— 待最终确认。
- 本地内嵌词典（AI 降级）数据源：使用现成开源英汉词典还是另行准备 —— 待确认，已在 tasks 中作为待办。
