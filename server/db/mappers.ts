import type {
  Project,
  Todo,
  ResearchNote,
  ResourceItem,
  User,
  Objective,
  Insight,
} from '../../src/types'
import {
  users,
  projects,
  projectMilestones,
  projectCheckins,
  todos,
  researchNotes,
  resources,
  insights,
} from './schema'

type UserRow = (typeof users)['$inferSelect']
type ProjectRow = (typeof projects)['$inferSelect']
type MilestoneRow = (typeof projectMilestones)['$inferSelect']
type CheckinRow = (typeof projectCheckins)['$inferSelect']
type TodoRow = (typeof todos)['$inferSelect']
type ResearchRow = (typeof researchNotes)['$inferSelect']
type ResourceRow = (typeof resources)['$inferSelect']
type InsightRow = (typeof insights)['$inferSelect']

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt,
  }
}

export function toProject(
  row: ProjectRow,
  milestones: MilestoneRow[],
  checkins: CheckinRow[],
  objectives: Objective[],
): Project {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    status: row.status,
    phase: row.phase,
    progress: row.progress,
    startDate: row.startDate,
    localPath: row.localPath,
    repoUrl: row.repoUrl ?? '',
    liveUrl: row.liveUrl ?? '',
    conditions: row.conditions,
    bottlenecks: row.bottlenecks,
    references: row.references,
    learning: row.learning,
    objectives,
    milestones: milestones.map(m => ({ title: m.title, doneAt: m.doneAt })),
    checkins: checkins.map(c => ({ id: c.id, date: c.date, note: c.note })),
    tags: row.tags,
    accent: row.accent,
  }
}

export function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    title: row.title,
    detail: row.detail ?? undefined,
    projectId: row.projectId ?? undefined,
    parentId: row.parentId ?? undefined,
    priority: row.priority,
    difficulty: row.difficulty,
    status: row.status,
    horizon: row.horizon,
    dueDate: row.dueDate ?? undefined,
    createdAt: row.createdAt,
    percentDone: row.percentDone ?? 0,
    repeatAfter: row.repeatAfter ?? 0,
    repeatMode: row.repeatMode ?? 0,
    startDate: row.startDate ?? undefined,
    hexColor: row.hexColor ?? undefined,
  }
}

export function toResearch(row: ResearchRow, projectIds: string[]): ResearchNote {
  return {
    id: row.id,
    title: row.title,
    teaser: row.teaser,
    body: row.body,
    projectIds,
    tags: row.tags,
    stage: row.stage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toResource(row: ResourceRow): ResourceItem {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    projectId: row.projectId ?? undefined,
    url: row.url ?? undefined,
    author: row.author ?? undefined,
    tags: row.tags,
    summary: row.summary ?? undefined,
    addedAt: row.addedAt,
    status: row.status,
  }
}

export function toInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    projectId: row.projectId ?? undefined,
    tags: row.tags,
    createdAt: row.createdAt,
  }
}
