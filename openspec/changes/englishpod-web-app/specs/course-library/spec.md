## ADDED Requirements

### Requirement: 课程列表浏览
系统 SHALL 以列表/网格形式展示全部 365 节课程，并显示标题、难度标签、时长和学习状态。

#### Scenario: 查看课程列表
- **WHEN** 用户进入课程列表页
- **THEN** 系统从 manifest 加载 365 课并展示各课标题、时长、难度与学习状态（未开始/进行中/已完成）

#### Scenario: 筛选与排序
- **WHEN** 用户按编号排序或按难度筛选
- **THEN** 列表按所选条件刷新显示

### Requirement: 课程详情页
系统 SHALL 提供集成音频播放器、字幕面板与可折叠 PDF 面板的一体化课程详情页。

#### Scenario: 打开课程
- **WHEN** 用户点击某课程卡片
- **THEN** 进入该课详情页并加载其音频、双语字幕与课程元数据

### Requirement: 静态资源服务
系统 SHALL 通过 HTTP 提供 Volume 挂载的课程音频、PDF 与字幕 JSON，并支持音频按需/范围加载。

#### Scenario: 按需加载音频
- **WHEN** 用户播放音频并拖动进度条
- **THEN** 服务端支持 Range 请求，音频按需加载而非整课预载
