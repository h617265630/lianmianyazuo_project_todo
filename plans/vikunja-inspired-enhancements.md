# Vikunja 风格增强方案

## 目标
参考 Vikunja 的数据模型和逻辑，增强「连绵雅座」的：
1. **Todo 能力**（TaskRelation / Reminder / Attachment / Comment / Position / Repeat）
2. **多用户权限体系**（ProjectUser / Team / TeamProject）
3. **ProjectView + Bucket 看板视图**
4. **保持 research / insights 模块**

---

## 一、Schema 变更

### 1.1 Todo 增强

**新增表：**

```typescript
// 任务关系（阻塞、被阻塞、相关、子任务）
taskRelations = pgTable('task_relations', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  otherTaskId: text('other_task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  relationKind: text('relation_kind').notNull(), // 'subtask' | 'parenttask' | 'related' | 'blocking' | 'blocked'
})

// 任务提醒
taskReminders = pgTable('task_reminders', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  dueDate: text('due_date').notNull(), // YYYY-MM-DD HH:MM
  triggeredAt: text('triggered_at'),   // 已触发的记录
})

// 任务附件（文件 URL）
taskAttachments = pgTable('task_attachments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  createdAt: text('created_at').notNull(),
})

// 任务评注
taskComments = pgTable('task_comments', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
})

// 任务在每个视图的排序位置
taskPositions = pgTable('task_positions', {
  taskId: text('task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  projectViewId: text('project_view_id').notNull().references(() => projectViews.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
})

// 任务在每个视图的看板列位置
taskBuckets = pgTable('task_buckets', {
  taskId: text('task_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  projectViewId: text('project_view_id').notNull().references(() => projectViews.id, { onDelete: 'cascade' }),
  bucketId: text('bucket_id').notNull().references(() => buckets.id, { onDelete: 'cascade' }),
})
```

**todos 表扩增字段：**
```typescript
percentDone: integer('percent_done').default(0),   // 0-100
repeatAfter: integer('repeat_after').default(0),    // 重复间隔（秒），0=不重复
repeatMode: integer('repeat_mode').default(0),       // 0=默认，1=每月，2=从完成日期
startDate: text('start_date'),                        // 开始日期
hexColor: text('hex_color'),                          // 任务颜色
```

### 1.2 权限体系

**新增表：**

```typescript
// 团队
teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: text('created_at').notNull(),
})

// 团队成员
teamMembers = pgTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isAdmin: boolean('is_admin').notNull().default(false),
})

// 用户-项目权限
projectUsers = pgTable('project_users', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  permission: integer('permission').notNull().default(0), // 0=read, 1=write, 2=admin
})

// 团队-项目权限
teamProjects = pgTable('team_projects', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  permission: integer('permission').notNull().default(0),
})
```

**users 表扩增：**
```typescript
isAdmin: boolean('is_admin').notNull().default(false)
```

### 1.3 看板视图

**新增表：**

```typescript
// 项目视图
projectViews = pgTable('project_views', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  viewKind: integer('view_kind').notNull().default(0), // 0=list, 1=gantt, 2=table, 3=kanban
  filter: text('filter'),                               // JSON filter expression
  position: integer('position').notNull().default(0),
  bucketConfigMode: integer('bucket_config_mode').notNull().default(0), // 0=none, 1=manual, 2=filter
})

// 看板列
buckets = pgTable('buckets', {
  id: text('id').primaryKey(),
  projectViewId: text('project_view_id').notNull().references(() => projectViews.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  limit: integer('limit').notNull().default(0),       // 0=无限制
  position: integer('position').notNull().default(0),
})
```

**projects 表扩增：**
```typescript
parentProjectId: text('parent_project_id').references(() => projects.id, { onDelete: 'set null' }) // 嵌套项目
```

---

## 二、路由变更

### 2.1 Todo 路由扩增（server/routes/todos.ts）
- `POST /:id/relations` — 添加任务关系
- `DELETE /:id/relations/:relationId` — 删除任务关系
- `GET /:id/relations` — 获取任务关系列表
- `POST /:id/reminders` — 添加提醒
- `DELETE /:id/reminders/:reminderId` — 删除提醒
- `POST /:id/attachments` — 添加附件
- `DELETE /:id/attachments/:attachmentId` — 删除附件
- `POST /:id/comments` — 添加评注
- `GET /:id/comments` — 获取评注列表
- `PATCH /:id/position` — 更新视图位置
- `PATCH /:id/bucket` — 更新看板列

### 2.2 项目路由扩增（server/routes/projects.ts）
- `POST /` — 创建项目时设置初始视图（默认 list + kanban）
- `GET /:id/views` — 获取所有视图
- `POST /:id/views` — 创建视图
- `PATCH /views/:viewId` — 更新视图
- `DELETE /views/:viewId` — 删除视图
- `POST /views/:viewId/buckets` — 添加看板列
- `PATCH /views/:viewId/buckets/:bucketId` — 更新看板列
- `DELETE /views/:viewId/buckets/:bucketId` — 删除看板列

### 2.3 新增权限路由（server/routes/teams.ts）
- `POST /teams` — 创建团队
- `GET /teams` — 获取我的团队列表
- `POST /teams/:id/members` — 添加团队成员
- `DELETE /teams/:id/members/:userId` — 移除团队成员
- `POST /projects/:id/users` — 授予用户项目权限
- `DELETE /projects/:id/users/:userId` — 移除用户项目权限
- `POST /projects/:id/teams` — 授予团队项目权限
- `DELETE /projects/:id/teams/:teamId` — 移除团队项目权限

### 2.4 权限检查中间件更新
`requireAuth` → `requireProjectAccess(permissionLevel)`，检查顺序：
1. 用户是项目 owner
2. `project_users` 表中该用户的权限
3. 用户所属团队在 `team_projects` 中的权限

---

## 三、实现顺序

### Phase 1: Todo 增强
1. 迁移文件添加新表
2. Schema 添加新字段到 todos
3. `server/db/mappers.ts` 添加新 mapper
4. `server/routes/todos.ts` 添加 relation/reminder/attachment/comment/position 路由

### Phase 2: 看板视图
1. 迁移文件添加 projectViews + buckets 表
2. Schema 添加 parentProjectId 到 projects
3. `server/routes/projects.ts` 添加 views/buckets 路由
4. 前端看板视图组件

### Phase 3: 权限体系
1. 迁移文件添加 teams/teamMembers/projectUsers/teamProjects 表
2. Schema 添加 isAdmin 到 users
3. `server/routes/teams.ts` 新建
4. `server/middleware/auth.ts` 增强权限检查
5. 所有路由的 ownership 检查替换为权限检查

---

## 四、注意事项
- 所有新表 ID 使用 text + `t-${Date.now()}-${random}` 格式保持一致
- 保持现有的 horizon 体系（today/week/month/long）不变
- research / insights 模块完全保留，不改动
- 日期统一用 text (YYYY-MM-DD)，时间用 YYYY-MM-DD HH:MM
- 迁移前务必 `db:push` 测试
