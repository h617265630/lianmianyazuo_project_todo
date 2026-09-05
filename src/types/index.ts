export type ProjectStatus = 'planning' | 'in-progress' | 'blocked' | 'completed' | 'archived'
export type ProjectPhase = 'started' | 'exploring'

export interface ProjectCheckin {
  id: string
  date: string
  note: string
}

export interface KeyResult {
  id: string
  title: string
  progress: number // 0-100
}

export interface Objective {
  id: string
  title: string
  keyResults: KeyResult[]
}

export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  status: ProjectStatus
  /** started：已开始；exploring：还在准备/探视 */
  phase: ProjectPhase
  progress: number // 0-100
  startDate: string
  localPath: string
  repoUrl?: string
  liveUrl?: string
  /** Conditions / prerequisites needed to advance */
  conditions: string[]
  /** Bottlenecks / blockers currently encountered */
  bottlenecks: string[]
  /** Related references (links / notes) */
  references: string[]
  /** Key knowledge + skills being learned through this project */
  learning: string[]
  /** OKR-style objectives */
  objectives: Objective[]
  /** Milestones already passed */
  milestones: { title: string; doneAt: string }[]
  /** Recent short log entries */
  checkins: ProjectCheckin[]
  tags: string[]
  accent: 'amber' | 'stone' | 'emerald'
}

export type TodoPriority = 'low' | 'medium' | 'high'
export type TodoStatus = 'todo' | 'doing' | 'done'
export type TodoDifficulty = 'easy' | 'medium' | 'hard'
/** 时间跨度：用户手动选择。today/week/month 为短期，long 为长期 */
export type TodoHorizon = 'today' | 'week' | 'month' | 'long'

export interface Todo {
  id: string
  userId?: string
  title: string
  detail?: string
  projectId?: string
  /** 子 todo 的父级 id，null/undefined 表示顶层 */
  parentId?: string
  priority: TodoPriority
  difficulty: TodoDifficulty
  status: TodoStatus
  /** 手动选择的时间跨度，与 dueDate 相互独立 */
  horizon: TodoHorizon
  dueDate?: string
  createdAt: string
  // --- Vikunja-style 扩增 ---
  percentDone?: number       // 0-100
  repeatAfter?: number       // 秒，0=不重复
  repeatMode?: number        // 0=默认，1=每月，2=从完成日期
  startDate?: string
  hexColor?: string
  // --- 关联数据（按需加载）---
  relations?: TaskRelation[]
  reminders?: TaskReminder[]
  attachments?: TaskAttachment[]
  comments?: TaskComment[]
}

export type RelationKind = 'subtask' | 'parenttask' | 'related' | 'blocking' | 'blocked'

export interface TaskRelation {
  id: string
  taskId: string
  otherTaskId: string
  relationKind: RelationKind
}

export interface TaskReminder {
  id: string
  taskId: string
  dueDate: string  // YYYY-MM-DD HH:MM
  triggeredAt?: string
}

export interface TaskAttachment {
  id: string
  taskId: string
  fileUrl: string
  fileName: string
  createdAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  body: string
  createdAt: string
}

export type ResearchStage = 'seedling' | 'growing' | 'mature' | 'archived'

export interface ResearchNote {
  id: string
  title: string
  /** Short teaser shown in lists */
  teaser: string
  /** Long-form body (plain text or light markdown) */
  body: string
  /** Which project(s) this research belongs to */
  projectIds: string[]
  tags: string[]
  stage: ResearchStage
  createdAt: string
  updatedAt: string
}

export interface ResourceItem {
  id: string
  title: string
  kind: ResourceKind
  projectId?: string
  url?: string
  author?: string
  /** Free-form tags for cross-cutting search */
  tags: string[]
  summary?: string
  addedAt: string
  /** Reading/study status */
  status: 'unread' | 'reading' | 'read' | 'archived'
}

export type ResourceKind = 'article' | 'video' | 'doc' | 'repo' | 'paper' | 'tool' | 'note' | 'book'

export type InsightKind = 'method' | 'insight'

export interface Insight {
  id: string
  kind: InsightKind
  title: string
  body: string
  /** 可关联项目，也可独立 */
  projectId?: string
  tags: string[]
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  isAdmin?: boolean
}

// --- ProjectView / Bucket（看板视图）---
export type ViewKind = 0 | 1 | 2 | 3  // 0=list 1=gantt 2=table 3=kanban

export interface ProjectView {
  id: string
  projectId: string
  title: string
  viewKind: ViewKind
  filter?: string
  position: number
  bucketConfigMode: 0 | 1 | 2
  buckets?: Bucket[]
}

export interface Bucket {
  id: string
  projectViewId: string
  title: string
  limit: number   // 0=无限制
  position: number
}

// --- 团队 & 权限 ---
export type Permission = 0 | 1 | 2  // 0=read 1=write 2=admin

export interface Team {
  id: string
  name: string
  description?: string
  isPublic: boolean
  createdAt: string
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  isAdmin: boolean
}

export interface ProjectUser {
  id: string
  userId: string
  projectId: string
  permission: Permission
}

export interface TeamProject {
  id: string
  teamId: string
  projectId: string
  permission: Permission
}
