# 连绵雅座

以项目为核心的 Todo 和资源管理工作台。Todo 属于用户，可以独立存在，也可以关联项目。

## 技术栈

- Vue 3、Vite、TypeScript、Tailwind CSS、Pinia
- Express API、Drizzle ORM、PostgreSQL
- 开发环境使用本机 PostgreSQL；浏览器仅保存登录令牌和界面偏好

## 启动

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`。数据库连接位于 `.env`，日常操作见[本地数据库说明](docs/local-database.md)。

新环境可参考 `.env.example` 配置 PostgreSQL，并在空库执行 `npm run db:setup`。已有数据时只运行 `npm run db:migrate`，避免 seed 重置数据。

线上可以使用“Vercel 前端 + Render Free 后端 + Supabase PostgreSQL”。`render.yaml` 已准备好部署配置；Render 创建服务时会读取它。后端部署变量见 `.env.production.example`；先在后端执行 `npm run db:migrate`，再将 `vercel.json` 中的 API 地址替换为 Render 服务域名。不要把 `DATABASE_URL`、`JWT_SECRET` 或 Supabase service role key 放进前端。Railway 也可以继续使用，但当前项目的 Railway 试用额度已经到期。

如果只有两个人使用，也可以完全本地运行应用、只使用线上 Supabase 数据库。复制 `.env.supabase-local.example` 为 `.env`，两台电脑使用同一个 `DATABASE_URL`、`DATABASE_SSL=true` 和 `JWT_SECRET`，然后各自运行 `npm run dev`。这种模式不需要 Railway 或 Render；两台电脑的数据会通过 Supabase 共享。数据库迁移只在任意一台电脑执行一次：`npm run db:migrate`。

## 页面

| 路由 | 内容 |
| --- | --- |
| `/` | 项目入口、待办看板、历史待办、最近资料与思考 |
| `/projects` | 项目列表 |
| `/projects/:id` | 项目任务、相关资料、相关思考 |
| `/todos` | 全部待办、按项目/未关联筛选 |
| `/todos/by-date/:date` | 按日期和项目查看待办 |
| `/resources` | 资料库 |
| `/research` | 研究记录 |
| `/docs` | 综合资料 |

浅色/深色主题及原版/备用版 Todo 卡片可在顶部切换。

## 检查

```bash
npm run db:check
npm run typecheck
npm run build
node tests/todo-crud.mjs
```

CRUD 回归使用本地种子账号，只创建临时测试 Todo，并在测试结束后清理。关联规则与检查边界见 [Todo CRUD 检查记录](docs/todo-crud-review.md)。
