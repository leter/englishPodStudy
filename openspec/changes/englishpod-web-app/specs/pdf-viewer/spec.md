## ADDED Requirements

### Requirement: 内嵌 PDF 讲义
系统 SHALL 在课程详情页内嵌展示 PDF 讲义，支持缩放与翻页，并采用懒加载。

#### Scenario: 展开讲义
- **WHEN** 用户在课程详情页展开 PDF 面板
- **THEN** 系统懒加载该课 PDF 并支持缩放与翻页

#### Scenario: 边听边看
- **WHEN** 用户在播放音频的同时查看 PDF
- **THEN** PDF 面板与播放器在同页并存，互不打断

### Requirement: PDF 加载容错
系统 SHALL 在 PDF 缺失或加载失败时显示提示，且不阻塞音频与字幕。

#### Scenario: PDF 缺失
- **WHEN** 某课 PDF 不存在或加载失败
- **THEN** 面板显示错误提示，音频与字幕功能不受影响
