# 本地数据库

开发环境使用本机 PostgreSQL，连接配置保存在不提交到 Git 的 `.env` 中：

```dotenv
DATABASE_URL=postgres://localhost:5432/lianmian_dev
PORT=3001
```

连接默认使用当前系统用户。现有 `JWT_SECRET` 保持不变，原有账号可以继续登录。

## 日常使用

本机已经运行 PostgreSQL 16。需要手动启动时：

```bash
brew services start postgresql@16
npm run dev
```

前端地址 `http://localhost:5173`，后端地址 `http://localhost:3001`。

```bash
npm run db:check     # 查看实际连接地址、库名及主要表的记录数
npm run db:migrate   # 应用新增数据库迁移
```

## 数据保留

本次将云端的应用表复制到新的 `lianmian_dev` 本地库，并逐表校验数据一致性。

- 云端数据保持原样；后续本地修改不会自动同步回云端。
- 原有本地 `lianmian` 数据库保留。
- `.env.remote.local` 保存切换前的连接配置；不要提交或分享此文件。
- `.local/database/source-snapshot.json` 保存复制时的应用数据快照，包含账户数据，已忽略提交并限制文件权限。

`npm run db:seed` 和 `npm run db:setup` 中的 seed 会重置示例数据，已有数据时应使用 `db:migrate`。

## 本地备份

```bash
pg_dump -h localhost -Fc lianmian_dev -f .local/database/lianmian-dev.backup
```

修改 `.env` 连接后须重启后端。若切回云端，仅恢复连接不会把本地新增数据带回云端。
