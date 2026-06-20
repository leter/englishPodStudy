## ADDED Requirements

### Requirement: 单镜像 Docker 部署
系统 SHALL 以单 Docker 镜像（后端托管 SPA 静态产物）配合 docker-compose 部署，运行时镜像不含 Python/ML 依赖，目标小于 500MB。

#### Scenario: 一键启动
- **WHEN** 用户运行 `docker compose up`
- **THEN** 应用启动并对外提供 Web 界面与 API

#### Scenario: 镜像体积
- **WHEN** 构建运行时镜像
- **THEN** 镜像大小小于 500MB

### Requirement: Volume 挂载
系统 SHALL 将课程资源目录（只读）与 SQLite 数据库（读写）经 Docker Volume 挂载，使容器重建后数据不丢。

#### Scenario: 数据持久
- **WHEN** 删除并重建容器
- **THEN** 经 Volume 挂载的 SQLite 数据与课程资源仍然可用

### Requirement: 数据导出与导入
系统 SHALL 提供将当前用户数据导出为 JSON 以及从 JSON 导入的能力。

#### Scenario: 导出数据
- **WHEN** 用户触发导出
- **THEN** 系统下载包含该用户进度、生词本与复习记录的 JSON 文件

#### Scenario: 导入数据
- **WHEN** 用户上传此前导出的 JSON
- **THEN** 系统将其恢复到当前用户名下
