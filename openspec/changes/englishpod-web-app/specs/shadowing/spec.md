## ADDED Requirements

### Requirement: 跟读模式
系统 SHALL 提供跟读模式：播放一句后自动暂停，用 Web Speech API 识别用户跟读内容。

#### Scenario: 跟读一句
- **WHEN** 用户在跟读模式下听完一句
- **THEN** 音频自动暂停并开始语音识别，等待用户跟读

### Requirement: 发音对比与评分
系统 SHALL 将识别文本与原文比对，高亮差异并给出正确率评分。

#### Scenario: 显示对比结果
- **WHEN** 用户完成一句跟读
- **THEN** 系统高亮识别文本与原文的差异部分并显示匹配正确率

### Requirement: 浏览器兼容降级
系统 SHALL 在浏览器不支持 Web Speech API 时隐藏跟读入口并提示。

#### Scenario: 不支持的浏览器
- **WHEN** 当前浏览器不支持 Web Speech API
- **THEN** 跟读入口被隐藏并显示不支持提示
