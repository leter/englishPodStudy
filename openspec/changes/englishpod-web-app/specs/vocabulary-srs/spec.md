## ADDED Requirements

### Requirement: 一键收藏
系统 SHALL 允许将单词或整句收藏到生词本，并自动关联来源课程与音频时间片段。

#### Scenario: 收藏单词
- **WHEN** 用户在释义卡片点击收藏
- **THEN** 该词连同译文、音标、来源课程与音频时间戳写入生词本，并显示 Toast 反馈

#### Scenario: 收藏整句
- **WHEN** 用户在选中句上点击收藏整句
- **THEN** 整句及其音频片段引用被加入生词本

### Requirement: 生词本管理
系统 SHALL 提供生词本列表，支持按课程筛选、按收藏时间排序与手动删除。

#### Scenario: 删除条目
- **WHEN** 用户删除某生词
- **THEN** 该条目及其复习调度记录一并移除

### Requirement: SM-2 间隔重复引擎
系统 SHALL 用 SM-2 算法依据用户自评安排每条生词的下次复习日期。

#### Scenario: 计算下次复习
- **WHEN** 用户对某卡片给出自评评分（陌生/模糊/熟悉/掌握）
- **THEN** 系统按 SM-2 更新 easiness、interval、repetitions 并计算新的 due_date

### Requirement: 复习闪卡
系统 SHALL 以闪卡形式复习，正面为英文、背面为中文释义/音标/原文音频片段，支持键盘快捷键。

#### Scenario: 翻卡与评分
- **WHEN** 用户在闪卡上按空格翻转并按 1-4 评分
- **THEN** 卡片翻转显示背面，评分被记录并进入下一张

### Requirement: 每日复习提醒
系统 SHALL 在有到期复习内容时于首页显示提示与待复习数量。

#### Scenario: 显示待复习
- **WHEN** 用户进入应用且存在 due_date 不晚于今日的生词
- **THEN** 首页显示「你有 N 个词汇待复习」并提供进入复习入口
