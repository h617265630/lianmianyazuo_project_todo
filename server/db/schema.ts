import { pgTable, text, integer, pgEnum, primaryKey, type AnyPgColumn } from 'drizzle-orm/pg-core'

/* ============================================================
   连绵雅座 · PostgreSQL schema
   日期统一存 text (YYYY-MM-DD)，与前端字符串日期对齐
   简单字符串数组用 Postgres text[]，结构化子项拆表
   顶层实体都归属某个用户（userId），数据按用户隔离
   ============================================================ */

export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'in-progress',
  'blocked',
  'completed',
  'archived',
])
export const projectPhaseEnum = pgEnum('project_phase', ['started', 'exploring'])
export const todoStatusEnum = pgEnum('todo_status', ['todo', 'doing', 'done'])
// 时间跨度：由用户手动选择，不从 dueDate 推导
// today/week/month 为短期，long 为长期（通常没有明确截止日期）
export const todoHorizonEnum = pgEnum('todo_horizon', ['today', 'week', 'month', 'long'])
export const todoPriorityEnum = pgEnum('todo_priority', ['low', 'medium', 'high'])
export const todoDifficultyEnum = pgEnum('todo_difficulty', ['easy', 'medium', 'hard'])
export const relationKindEnum = pgEnum('relation_kind', ['subtask', 'parenttask', 'related', 'blocking', 'blocked'])
export const researchStageEnum = pgEnum('research_stage', [
  'seedling',
  'growing',
  'mature',
  'archived',
])
export const resourceKindEnum = pgEnum('resource_kind', [
  'article',
  'video',
  'doc',
  'repo',
  'paper',
  'tool',
  'note',
  'book',
])
export const resourceStatusEnum = pgEnum('resource_status', [
  'unread',
  'reading',
  'read',
  'archived',
])
export const insightKindEnum = pgEnum('insight_kind', ['method', 'insight'])
export const accentEnum = pgEnum('accent', ['amber', 'stone', 'emerald'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
})

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  status: projectStatusEnum('status').notNull().default('planning'),
  // started：已开始；exploring：还在准备/探视
  phase: projectPhaseEnum('phase').notNull().default('exploring'),
  progress: integer('progress').notNull().default(0),
  startDate: text('start_date').notNull(),
  localPath: text('local_path').notNull(),
  repoUrl: text('repo_url'),
  liveUrl: text('live_url'),
  conditions: text('conditions').array().notNull(),
  bottlenecks: text('bottlenecks').array().notNull(),
  references: text('reference_links').array().notNull(),
  learning: text('learning').array().notNull(),
  tags: text('tags').array().notNull(),
  accent: accentEnum('accent').notNull().default('stone'),
  // 嵌套项目
  parentProjectId: text('parent_project_id').references((): AnyPgColumn => projects.id, { onDelete: 'set null' }),
})

export const projectObjectives = pgTable('project_objectives', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull(),
})

export const projectKeyResults = pgTable('project_key_results', {
  id: text('id').primaryKey(),
  objectiveId: text('objective_id')
    .notNull()
    .references(() => projectObjectives.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  progress: integer('progress').notNull().default(0),
  createdAt: text('created_at').notNull(),
})

export const projectMilestones = pgTable('project_milestones', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  doneAt: text('done_at').notNull(),
})

export const projectCheckins = pgTable('project_checkins', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  note: text('note').notNull(),
})

export const todos = pgTable('todos', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  detail: text('detail'),
  // nullable：可挂靠项目（支线），也可独立存在（主线）
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  // 子 todo：自引用父级，null 表示顶层
  parentId: text('parent_id').references((): AnyPgColumn => todos.id, { onDelete: 'cascade' }),
  priority: todoPriorityEnum('priority').notNull().default('medium'),
  difficulty: todoDifficultyEnum('difficulty').notNull().default('medium'),
  status: todoStatusEnum('status').notNull().default('todo'),
  // 手动选择的时间跨度，与 dueDate 相互独立
  horizon: todoHorizonEnum('horizon').notNull().default('week'),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull(),
  // --- Vikunja-style 扩增 ---
  percentDone: integer('percent_done').notNull().default(0),
  repeatAfter: integer('repeat_after').notNull().default(0),    // 秒，0=不重复
  repeatMode: integer('repeat_mode').notNull().default(0),       // 0=默认，1=每月，2=从完成日期
  startDate: text('start_date'),
  hexColor: text('hex_color'),
})

// 任务关系（阻塞、被阻塞、相关、子任务）
export const taskRelations = pgTable('task_relations', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  otherTaskId: text('other_task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  relationKind: relationKindEnum('relation_kind').notNull(),
})

// 任务提醒
export const taskReminders = pgTable('task_reminders', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  dueDate: text('due_date').notNull(), // YYYY-MM-DD HH:MM
  triggeredAt: text('triggered_at'),
})

// 任务附件
export const taskAttachments = pgTable('task_attachments', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  createdAt: text('created_at').notNull(),
})

// 任务评注
export const taskComments = pgTable('task_comments', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
})

// 项目视图（list / gantt / table / kanban）
export const projectViews = pgTable('project_views', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  viewKind: integer('view_kind').notNull().default(0),  // 0=list 1=gantt 2=table 3=kanban
  filter: text('filter'),                                 // JSON filter
  position: integer('position').notNull().default(0),
  bucketConfigMode: integer('bucket_config_mode').notNull().default(0), // 0=none 1=manual 2=filter
})

// 看板列
export const buckets = pgTable('buckets', {
  id: text('id').primaryKey(),
  projectViewId: text('project_view_id')
    .notNull()
    .references(() => projectViews.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  limit: integer('limit').notNull().default(0),      // 0=无限制
  position: integer('position').notNull().default(0),
})

// 任务在每个视图的排序位置
export const taskPositions = pgTable('task_positions', {
  taskId: text('task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  projectViewId: text('project_view_id')
    .notNull()
    .references(() => projectViews.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
})

// 任务在每个视图的看板列
export const taskBuckets = pgTable('task_buckets', {
  taskId: text('task_id')
    .notNull()
    .references(() => todos.id, { onDelete: 'cascade' }),
  projectViewId: text('project_view_id')
    .notNull()
    .references(() => projectViews.id, { onDelete: 'cascade' }),
  bucketId: text('bucket_id')
    .notNull()
    .references(() => buckets.id, { onDelete: 'cascade' }),
})

// 团队
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: integer('is_public').notNull().default(0), // 0=false 1=true（pg integerbool）
  createdAt: text('created_at').notNull(),
})

// 团队成员
export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  isAdmin: integer('is_admin').notNull().default(0),
})

// 用户-项目权限（0=read 1=write 2=admin）
export const projectUsers = pgTable('project_users', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  permission: integer('permission').notNull().default(0),
})

// 团队-项目权限
export const teamProjects = pgTable('team_projects', {
  id: text('id').primaryKey(),
  teamId: text('team_id')
    .notNull()
    .references(() => teams.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  permission: integer('permission').notNull().default(0),
})

export const researchNotes = pgTable('research_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  teaser: text('teaser').notNull(),
  body: text('body').notNull(),
  stage: researchStageEnum('stage').notNull().default('seedling'),
  tags: text('tags').array().notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const researchNoteProjects = pgTable(
  'research_note_projects',
  {
    researchNoteId: text('research_note_id')
      .notNull()
      .references(() => researchNotes.id, { onDelete: 'cascade' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.researchNoteId, t.projectId] })],
)

export const resources = pgTable('resources', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  kind: resourceKindEnum('kind').notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  url: text('url'),
  author: text('author'),
  tags: text('tags').array().notNull(),
  summary: text('summary'),
  addedAt: text('added_at').notNull(),
  status: resourceStatusEnum('status').notNull().default('unread'),
})

// 一页 BOM 清单及用户标记状态
export const bomItems = pgTable('bom_items', {
  id: text('id').primaryKey(),
  bomKey: text('bom_key').notNull(),
  lineNo: text('line_no').notNull(),
  quantity: integer('quantity').notNull().default(0),
  description: text('description').notNull(),
  designators: text('designators').notNull().default(''),
  package: text('package').notNull().default(''),
  value: text('value').notNull().default(''),
  manufacturerPart: text('manufacturer_part').notNull().default(''),
  manufacturer: text('manufacturer').notNull().default(''),
  supplierPart: text('supplier_part').notNull().default(''),
  supplier: text('supplier').notNull().default(''),
})

export const bomItemMarks = pgTable('bom_item_marks', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bomItemId: text('bom_item_id').notNull().references(() => bomItems.id, { onDelete: 'cascade' }),
  markedAt: text('marked_at').notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.bomItemId] })])

export const insights = pgTable('insights', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  // 掌握的方法 / 感悟：可独立，也可关联项目
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  kind: insightKindEnum('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  tags: text('tags').array().notNull(),
  createdAt: text('created_at').notNull(),
})
