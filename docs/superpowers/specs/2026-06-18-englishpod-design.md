# EnglishPod 设计文档

> 配套 PRD：`PRD.md` ｜ 日期：2026-06-18 ｜ 范围：个人英语学习 Web 应用，自托管，未来开源

## 1. 设计要点（已与需求方确认）

1. **中文字幕来源**：现有 SRT 全是英文（Whisper 生成），无中文。采用**离线 AI 预生成**——部署前用脚本批量调 LLM 把 365 课 SRT 逐句译中文，产出双语 JSON。运行时零延迟、零成本、可离线。
2. **技术栈**：由设计方推荐（见第 3 节），运行时走 TypeScript 全栈，重型 ML 仅留在离线工具。
3. **逐词卡拉 OK 高亮（WhisperX）**：技术风险最高（需 GPU、锁 WhisperX 3.3.2、需抽样校验对齐精度），**延后到最后且作为可选增强**。MVP 用现有 SRT 做句级同步即可满足 PRD 的 <200ms。前端从一开始按"`words.json` 缺失 → 降级句级"设计，后加零成本。
4. **多用户与认证**：数据存服务端、**从第一天起按 `user_id` 隔离**、认证做成开关（`AUTH_ENABLED`）。MVP 是单用户体验，开源时打开开关即多用户带账户密码，中间无数据迁移痛苦（见第 6 节）。

## 2. 整体架构

核心判断：单用户/小社区、自托管、重前端交互、内容静态。架构上把三件事彻底分开。

```
┌─────────────────────────────────────────────────────────────┐
│                     浏览器 (React SPA)                         │
│   课程列表 / 学习页 / 生词本 / 复习闪卡 / 仪表盘 / 设置         │
└───────────────┬──────────────────────────┬──────────────────┘
                │ REST/JSON                 │ 直接静态请求
                ▼                           ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│   运行时后端 (Node + Hono)     │  │  静态资源 (Volume 挂载, 只读) │
│  · 学习进度 CRUD              │  │  /content/0001/             │
│  · 生词本 CRUD               │  │     audio.mp3               │
│  · SM-2 复习调度             │  │     lesson.pdf              │
│  · AI 代理 (转发 LLM)        │  │     subtitles.json (双语)    │
│  · 认证 (可开关)             │  │     words.json (可选,逐词)   │
│  · 数据导出/导入             │  │  manifest.json (365课索引)  │
│        │                     │  └────────────────────────────┘
│        ▼                     │
│   SQLite (单文件, Volume)     │
└──────────────────────────────┘

         ┌────────────────────────────────────────┐
         │   离线预处理工具 (Python, 不进运行时镜像)  │
         │   1. 翻译: LLM 把英文SRT逐句译中文 → 双语JSON│
         │   2. 对齐: WhisperX 生成逐词时间戳 → words.json│
         │   3. 生成 manifest.json                  │
         └────────────────────────────────────────┘
```

**关键原则：重的东西不进运行时。** WhisperX（PyTorch、GPU、数 GB）和翻译脚本是一次性离线批处理，只产出 JSON。运行时镜像无 Python、无 ML 依赖，Node-alpine 可压到 500MB 以内（PRD 硬指标）。课程音频/PDF 体积大，走 Volume 挂载，不进镜像。

## 3. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| **前端** | React 18 + TypeScript + Vite | 生态最大、组件多；Vite 构建快、产物小 |
| UI | Tailwind CSS + shadcn/ui | 自带暗/亮主题，组件可裁剪，无运行时 CSS-in-JS 开销 |
| 状态 | Zustand + TanStack Query | Zustand 管本地 UI 状态（播放器/字幕模式），Query 管服务端数据缓存。比 Redux 轻，契合单用户 |
| 音频 | 原生 HTML5 `<audio>` + 自定义 hook | 字幕同步只需 `timeupdate` + 二分查找定位句子，无需 wavesurfer 等重库 |
| 字幕 | 运行时直接读 `subtitles.json` | 不在前端解析 SRT——解析/翻译已在离线做完，前端只做时间匹配渲染 |
| PDF | `react-pdf` (pdf.js) | 懒加载，展开讲义面板才加载 |
| **运行时后端** | Node + Hono + TypeScript | Hono 极轻、快、镜像小；与前端共享 TS 类型 |
| ORM/DB | Drizzle ORM + SQLite (better-sqlite3) | 单用户首选：单文件、零配置、Volume 挂载即备份。Drizzle 类型安全且可平滑切 Postgres |
| 认证 | argon2/bcrypt 哈希 + HttpOnly Cookie 会话 | 仅 `AUTH_ENABLED=true` 时启用，密码绝不存明文 |
| **离线工具** | Python：WhisperX(锁 3.3.2) + LLM 翻译脚本 | 独立 CLI，支持单课/批量，GPU 跑 |
| 部署 | 单 Docker 镜像（后端托管 SPA 静态产物）+ docker-compose | 一个容器跑后端+前端，content 与 sqlite 走 volume |

**两个有意识的取舍：**
- **运行时不用 Python/FastAPI**：预处理是 Python，但运行时逻辑轻（CRUD + SM-2 + AI 转发），TS 全栈共享类型、镜像更小。Python 仅留离线工具。
- **不在前端解析 SRT**：既然要离线生成双语 + 逐词时间戳，把解析也挪到离线，运行时只消费干净 JSON，更稳更快，容错在离线一次性解决。

## 4. 数据模型（SQLite）

只存**用户产生的数据**；课程内容是静态文件，不进库。所有用户数据表自带 `user_id`（见第 6 节）。

```
lessons        ← 不进库，由 manifest.json 提供 (id, title, 难度, 时长, 音频/pdf/字幕路径)

users          (id PK, username, password_hash, created_at)
progress       (user_id, lesson_id, status, position_sec, total_listened_sec,
                completed_at, updated_at)   -- PK(user_id, lesson_id)
vocab          (id PK, user_id, type[word|sentence], text, translation, phonetic,
                lesson_id, audio_start, audio_end, created_at)
reviews        (vocab_id PK→vocab, user_id, easiness, interval, repetitions,
                due_date, last_grade)        -- SM-2 状态
study_logs     (user_id, date, listened_sec, lessons_touched, reviews_done)  -- PK(user_id, date)
settings       (user_id, key, value)         -- PK(user_id, key)；AI Key 等按用户存
```

- 复习调度 = `reviews` 的 SM-2 字段；首页"待复习数" = `SELECT count(*) FROM reviews WHERE user_id=? AND due_date <= today`。
- `vocab` 只存引用（`lesson_id` + 音频时间戳），不复制音频。
- 数据导出 = 按当前 user_id dump 上述表为 JSON。

## 5. 功能 / 数据流

**学习页交互闭环（核心）：**

```
打开课程
  └─> 加载 subtitles.json + manifest 元数据 + GET /progress/:id
        └─> 渲染字幕面板(双语，按 settings 决定模式)
              └─> audio.timeupdate ──二分查找──> 高亮当前句 + 自动滚动
                    ├─ 点单词 ─> 本地词典弹卡 ──[AI详解]──> POST /ai/word ─> 缓存
                    │              └─[收藏]─> POST /vocab ─> Toast
                    ├─ 点整句 ─> seek + 单句循环 ──[收藏整句]─> POST /vocab
                    └─ 播放结束 ─> 课程小结 ─> PATCH /progress (completed)
```

**复习闭环：**

```
首页 ─GET /reviews/due─> N 个待复习
   └─> 闪卡(正:英文 / 翻转:中文+音标+原文音频片段)
         └─> 自评 1-4 ─> POST /reviews/:id/grade ─SM-2─> 算下次 due_date
               └─> 全部过完 ─> 今日统计
```

**模块全景：**

```
┌── 仪表盘 ──┐  ┌── 课程 ──┐  ┌── 生词本 ──┐  ┌── 复习 ──┐  ┌── 设置 ──┐
│ 继续学习   │  │ 列表/筛选 │  │ 列表/筛选  │  │ 闪卡队列 │  │ 主题     │
│ 统计卡片   │  │ 学习页    │  │ 删除/收藏  │  │ 自评评分 │  │ AI配置   │
│ 热力图     │  │ ·播放器   │  └───────────┘  │ 今日统计 │  │ 字幕偏好 │
│ 待复习提醒 │  │ ·字幕     │                  └─────────┘  │ 导出/导入│
└───────────┘  │ ·PDF      │                  (含认证开关时:登录/注册)
               └──────────┘
```

## 6. 数据存储与认证（可插拔多用户）

**核心思路：现在不建认证 UI，但从第一天起把数据按 `user_id` 隔离。** 真正的架构风险不是"有没有登录框"，而是"数据有没有按用户切分"。登录框几天能加；但若数据默认全局唯一，将来拆多用户要做痛苦的数据迁移。用一个 `user_id` 字段（单用户时永远是 1）把这个最贵的决定零成本提前解决。

**物理落点：**

```
宿主机                          容器内
./data/englishpod.db    ──挂载─> /app/data/englishpod.db   ← 所有用户数据
./content/              ──挂载─> /app/content/             ← 课程文件(只读)
```

**两种模式（一个环境变量切换）：**

| | 单用户模式 (MVP) | 多用户模式 (开源) |
|---|---|---|
| `AUTH_ENABLED` | `false` | `true` |
| 登录页 | 不显示 | 显示注册/登录 |
| 当前用户 | 预置默认用户 id=1 | 会话中的真实用户 |
| 查询 | `WHERE user_id=1` | `WHERE user_id=<会话用户>` |
| 数据表结构 | —— 两模式完全相同 —— | —— 无需迁移 —— |

**多用户模式启用时才引入：** 注册（创建用户）、密码校验（argon2/bcrypt 哈希，绝不存明文）、会话（HttpOnly Cookie 或 JWT）。所有 API 通过中间件解析当前 `user_id` 并强制过滤。

**被否决的方案：**
- *数据存浏览器 IndexedDB*：绑死单设备，换设备/清缓存即丢，与 PRD "随时查看进度"冲突，复习/统计本质是服务端查询。❌
- *维持纯单用户、靠每人各自部署*：满足"各自部署"，但满足不了"一个部署多人共用"。仅适合该需求时可回退。

**存储引擎演进：** 小社区 SQLite 足够；真到数百并发，Drizzle 换 driver 到 Postgres + 加索引即可，业务代码几乎不动。

**备份：** SQLite 单文件，复制 `englishpod.db` 即完整备份；PRD 的"导出 JSON"是额外的可读格式导出。

## 7. 边界与降级

- **AI 不可用**：单词查询降级本地内嵌词典，提示"AI 服务暂不可用"。
- **音频加载失败**：显示重试，不阻塞字幕/PDF。
- **SRT/字幕异常**：离线阶段校验+容错；运行时若 `words.json` 缺失，逐词高亮降级为句级。
- **浏览器不支持 Web Speech API**：隐藏跟读入口并提示。
- **数据可移植**：JSON 导出/导入。

## 8. 分期（对 PRD 五阶段的微调）

| 阶段 | 内容 | 相对 PRD 的改动 |
|---|---|---|
| **预处理** | 翻译脚本跑 365 课 → 双语 JSON；生成 manifest | 提前到最前，前端依赖它 |
| **P1 核心播放** | 列表页 + 学习页 + 播放器 + **句级**字幕同步 + 模式切换 + 单句循环 | 逐词卡拉 OK 延后，只做句级（数据已有、零风险） |
| **P2 生词本+复习** | 本地词典弹卡 + 收藏 + 生词本 + SM-2 + 闪卡 | 同 PRD |
| **P3 进度+AI** | 进度持久化 + 仪表盘 + 热力图 + AI 单词/句子解析 + AI 配置 | 同 PRD |
| **P4 增强+部署** | PDF 内嵌 + 数据导出 + Docker/compose + README | 跟读、AI 对话归 P4/P5 |
| **P5 打磨** | 响应式 + 主题 + 边界处理 + **(可选)WhisperX 逐词高亮** | 逐词作为可选增强，前端已有句级降级 |

> 多用户认证开关在数据层从 P1 起就内建（`user_id` 字段 + 默认用户）；认证 UI 与密码校验可在开源前的独立小阶段启用，不阻塞主线。

## 9. 现有资源映射

| 资源 | 位置 | 用途 |
|---|---|---|
| 365 课音频 | `englishpod365/<范围>/<课号>/englishpod_B*pr.mp3` | 主讲音频（`rv` 为复习音频，暂不用） |
| 英文 SRT | `english_pod/srt/englishpod_*.srt` | 离线翻译的输入 |
| 纯文本转录 | `english_pod/txt/englishpod_*.txt` | WhisperX forced alignment 的参考文本 |
| PDF 讲义 | `english_pod/pdf/<范围>/englishpod_*.pdf` | 讲义内嵌查看 |
