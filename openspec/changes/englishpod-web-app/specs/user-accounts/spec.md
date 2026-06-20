## ADDED Requirements

### Requirement: 数据按用户隔离
系统 SHALL 为所有用户产生的数据（进度、生词本、复习、学习日志、设置）关联 `user_id`，所有查询按当前用户过滤。

#### Scenario: 按用户读取
- **WHEN** 后端处理任意用户数据请求
- **THEN** 仅返回当前 `user_id` 名下的数据

### Requirement: 单用户默认模式
系统 SHALL 在 `AUTH_ENABLED=false` 时使用预置默认用户（id=1）且不显示登录页。

#### Scenario: 默认用户启动
- **WHEN** 应用以 `AUTH_ENABLED=false` 首次启动
- **THEN** 自动建表并 seed 默认用户，所有操作归属该用户，无需登录

### Requirement: 可开关的认证
系统 SHALL 在 `AUTH_ENABLED=true` 时启用注册、密码校验与会话，密码以 argon2/bcrypt 哈希存储，且无需 schema 迁移。

#### Scenario: 注册与登录
- **WHEN** 在认证启用下用户注册并登录
- **THEN** 系统创建用户、以哈希存储密码、建立会话，后续请求按该用户隔离数据

#### Scenario: 拒绝未认证访问
- **WHEN** 认证启用下未登录用户请求受保护数据
- **THEN** 系统返回未授权且不泄露任何用户数据
