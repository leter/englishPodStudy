## 1. 项目脚手架与基础设施

- [ ] 1.1 建立 monorepo 结构：`apps/web`(React+TS+Vite)、`apps/server`(Node+Hono+TS)、`tools/preprocess`(Python)、共享 `packages/types`
- [ ] 1.2 配置 Tailwind + shadcn/ui，暗/亮主题（默认跟随系统）
- [ ] 1.3 配置后端 Drizzle ORM + SQLite(better-sqlite3)，首启自动建表
- [ ] 1.4 定义 DB schema：`users`/`progress`/`vocab`/`reviews`/`study_logs`/`settings`，全部含 `user_id`
- [ ] 1.5 实现 `AUTH_ENABLED=false` 默认用户(id=1) seed 与「当前用户」中间件
- [ ] 1.6 前端基础路由与布局骨架（仪表盘/课程/生词本/复习/设置）

## 2. 离线预处理工具 (content-preprocessing)

- [ ] 2.1 SRT 解析与校验模块（容错处理时间戳/格式异常课程）
- [ ] 2.2 LLM 逐句翻译脚本，输出 `content/<课号>/subtitles.json`（en/zh/start/end）
- [ ] 2.3 批处理支持断点续跑与单课重跑，跳过已完成课程
- [ ] 2.4 `manifest.json` 生成：扫描资源产出 365 课索引（id/标题/时长/音频/PDF/字幕路径）
- [ ] 2.5 (可选) WhisperX 3.3.2 forced alignment，产出 `content/<课号>/words.json`
- [ ] 2.6 对全部 365 课运行翻译与 manifest，抽样校验输出质量

## 3. 课程库与静态资源 (course-library)

- [ ] 3.1 后端：manifest 与静态资源服务，音频支持 HTTP Range 请求
- [ ] 3.2 前端：课程列表页（网格/列表、标题/难度/时长/状态）
- [ ] 3.3 前端：列表筛选（难度）与排序（编号）
- [ ] 3.4 前端：课程详情页骨架（播放器区 + 字幕区 + 可折叠 PDF 区）

## 4. 音频播放与字幕同步 (audio-subtitle-sync)

- [ ] 4.1 音频播放器：播放/暂停、进度拖拽、倍速、±5 秒、单句循环
- [ ] 4.2 字幕渲染：消费 `subtitles.json`，三种模式（双语/仅英文/隐藏）并持久化偏好
- [ ] 4.3 句级同步 hook：`timeupdate` + 二分查找高亮当前句、自动滚动居中（<200ms）
- [ ] 4.4 句点击跳转 + 单句循环
- [ ] 4.5 单词点击释义卡片（音标/词性/释义/例句占位）
- [ ] 4.6 逐词高亮：`words.json` 存在时逐词高亮，缺失时降级句级
- [ ] 4.7 字体大小调节（小/中/大），播放器滚动时固定顶部

## 5. 生词本与 SRS (vocabulary-srs)

- [ ] 5.1 本地内嵌词典数据准备与查询（释义卡片数据源 + AI 降级）
- [ ] 5.2 后端：vocab CRUD（关联来源课程与音频时间戳）
- [ ] 5.3 前端：一键收藏单词/整句 + Toast 反馈
- [ ] 5.4 前端：生词本管理（按课程筛选、按时间排序、删除）
- [ ] 5.5 SM-2 引擎：依据自评更新 easiness/interval/repetitions/due_date
- [ ] 5.6 复习闪卡 UI：翻卡、原文音频片段播放、键盘快捷键（空格/1-4）
- [ ] 5.7 每日待复习查询与首页提醒，复习完成统计

## 6. 学习进度与仪表盘 (learning-progress)

- [ ] 6.1 后端：progress CRUD（播放位置/状态/累计时长）
- [ ] 6.2 前端：进度自动保存与恢复、完成标记（自动+手动）
- [ ] 6.3 后端：study_logs 记录每日学习数据
- [ ] 6.4 前端：仪表盘统计卡片（完成数/365、本周天数、累计时长、生词量、今日待复习）
- [ ] 6.5 前端：连续学习热力图 + 「继续学习」入口

## 7. AI 辅助 (ai-assist)

- [ ] 7.1 后端：AI 代理（OpenAI 兼容 / Ollama），超时与错误处理
- [ ] 7.2 设置页：AI 配置（API 地址/Key/模型），按用户保存
- [ ] 7.3 AI 单词解析（携带语境，<2s 目标）+ 结果缓存
- [ ] 7.4 AI 句子解析（语法/翻译/重点词标注）
- [ ] 7.5 AI 对话练习（基于课程话题）
- [ ] 7.6 AI 不可用降级本地词典 + 提示

## 8. PDF 讲义 (pdf-viewer)

- [ ] 8.1 react-pdf 内嵌查看，懒加载、缩放、翻页
- [ ] 8.2 PDF 缺失/加载失败容错，不阻塞音频与字幕

## 9. 跟读练习 (shadowing)

- [ ] 9.1 跟读模式：播一句自动暂停 + Web Speech API 识别
- [ ] 9.2 识别文本与原文差异高亮 + 正确率评分
- [ ] 9.3 不支持浏览器隐藏入口并提示

## 10. 认证（开源多用户，可后置）(user-accounts)

- [ ] 10.1 `AUTH_ENABLED=true` 时启用注册、密码 argon2/bcrypt 哈希、会话(HttpOnly Cookie)
- [ ] 10.2 受保护路由中间件，未登录返回未授权且不泄露数据
- [ ] 10.3 登录/注册前端页面
- [ ] 10.4 验证单用户↔多用户切换无 schema 迁移

## 11. 部署与数据可移植 (app-deployment)

- [ ] 11.1 数据导出/导入（按当前用户 JSON）
- [ ] 11.2 多阶段 Dockerfile（构建 SPA → 后端托管静态产物，运行时不含 Python/ML）
- [ ] 11.3 docker-compose：content 只读挂载 + sqlite 读写挂载
- [ ] 11.4 验证镜像 <500MB、容器重建数据不丢
- [ ] 11.5 README（面向开源：部署、预处理、配置说明）

## 12. 打磨与测试

- [ ] 12.1 响应式：移动浏览器单栏布局，PDF 折叠到底部 Tab
- [ ] 12.2 边界处理：音频加载失败重试、断网/SRT 异常降级
- [ ] 12.3 端到端使用测试（学习闭环 + 复习闭环），修复 Bug
- [ ] 12.4 首屏加载 <3s、句级同步 <200ms 性能校验
