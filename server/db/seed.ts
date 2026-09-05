import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { db } from './index'
import {
  users,
  projects,
  projectObjectives,
  projectKeyResults,
  projectMilestones,
  projectCheckins,
  todos,
  researchNotes,
  researchNoteProjects,
  resources,
  insights,
  // Phase 1 new tables
  taskRelations,
  taskReminders,
  taskAttachments,
  taskComments,
  // Phase 2
  projectViews,
  buckets,
  taskPositions,
  taskBuckets,
  // Phase 3
  teams,
  teamMembers,
  projectUsers,
  teamProjects,
} from './schema'
import {
  seedProjects,
  seedTodos,
  seedResearch,
  seedResources,
  seedInsights,
} from '../../src/data/seed'
import { hashPassword } from '../auth/password'

const USERS = [
  { id: 'u-n', email: 'n@lianmian.dev', name: 'n', passwordHash: hashPassword('n1234'), createdAt: '2026-09-01' },
  { id: 'u-v', email: 'v@lianmian.dev', name: 'v', passwordHash: hashPassword('v1234'), createdAt: '2026-09-01' },
]

export async function seedDatabase() {
  // FK-safe truncate（先删子表，再删父表）
  await db.delete(taskBuckets)
  await db.delete(taskPositions)
  await db.delete(taskComments)
  await db.delete(taskAttachments)
  await db.delete(taskReminders)
  await db.delete(taskRelations)
  await db.delete(researchNoteProjects)
  await db.delete(projectKeyResults)
  await db.delete(projectObjectives)
  await db.delete(projectMilestones)
  await db.delete(projectCheckins)
  await db.delete(buckets)
  await db.delete(projectViews)
  await db.delete(insights)
  await db.delete(resources)
  await db.delete(researchNotes)
  await db.delete(todos)
  await db.delete(teamProjects)
  await db.delete(projectUsers)
  await db.delete(teamMembers)
  await db.delete(teams)
  await db.delete(projects)
  await db.delete(users)

  for (const u of USERS) {
    await db.insert(users).values(u)
  }
  const userId = USERS[0].id

  for (const p of seedProjects) {
    await db.insert(projects).values({
      id: p.id,
      userId,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      status: p.status,
      phase: p.phase,
      progress: p.progress,
      startDate: p.startDate,
      localPath: p.localPath,
      repoUrl: p.repoUrl || null,
      liveUrl: p.liveUrl || null,
      conditions: p.conditions,
      bottlenecks: p.bottlenecks,
      references: p.references,
      learning: p.learning,
      tags: p.tags,
      accent: p.accent,
    })
    for (const o of p.objectives) {
      await db.insert(projectObjectives).values({
        id: o.id,
        projectId: p.id,
        title: o.title,
        createdAt: p.startDate,
      })
      for (const kr of o.keyResults) {
        await db.insert(projectKeyResults).values({
          id: kr.id,
          objectiveId: o.id,
          title: kr.title,
          progress: kr.progress,
          createdAt: p.startDate,
        })
      }
    }
    for (const m of p.milestones) {
      await db.insert(projectMilestones).values({
        id: randomUUID(),
        projectId: p.id,
        title: m.title,
        doneAt: m.doneAt,
      })
    }
    for (const c of p.checkins) {
      await db.insert(projectCheckins).values({
        id: randomUUID(),
        projectId: p.id,
        date: c.date,
        note: c.note,
      })
    }
  }

  for (const t of seedTodos) {
    await db.insert(todos).values({
      id: t.id,
      userId,
      title: t.title,
      detail: t.detail ?? null,
      projectId: t.projectId ?? null,
      parentId: t.parentId ?? null,
      priority: t.priority,
      difficulty: t.difficulty,
      status: t.status,
      horizon: t.horizon,
      dueDate: t.dueDate ?? null,
      createdAt: t.createdAt,
      percentDone: 0,
      repeatAfter: 0,
      repeatMode: 0,
      startDate: null,
      hexColor: null,
    })
  }

  // v's todos
  const vId = USERS[1].id
  const vTodos: Omit<typeof todos.$inferInsert, 'userId'>[] = [
    { id: 'vt1', horizon: 'today', title: 'v 的待办：整理笔记', priority: 'high', difficulty: 'easy', status: 'todo', createdAt: '2026-09-06', dueDate: '2026-09-06', percentDone: 0, repeatAfter: 0, repeatMode: 0 },
    { id: 'vt2', horizon: 'today', title: 'v 的待办：写代码', priority: 'medium', difficulty: 'medium', status: 'todo', createdAt: '2026-09-06', dueDate: '2026-09-06', percentDone: 0, repeatAfter: 0, repeatMode: 0 },
    { id: 'vt3', horizon: 'today', title: 'v 的待办：看文档', priority: 'low', difficulty: 'easy', status: 'doing', createdAt: '2026-09-06', dueDate: '2026-09-06', percentDone: 30, repeatAfter: 0, repeatMode: 0 },
    { id: 'vt4', horizon: 'today', title: 'v 的待办：做测试', priority: 'high', difficulty: 'hard', status: 'done', createdAt: '2026-09-05', dueDate: '2026-09-06', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
    // history done
    { id: 'vt5', title: 'v 的历史已完成：整理笔记', priority: 'high', difficulty: 'easy', status: 'done', createdAt: '2026-09-01', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
    { id: 'vt6', title: 'v 的历史已完成：写代码', priority: 'medium', difficulty: 'medium', status: 'done', createdAt: '2026-09-02', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
    { id: 'vt7', title: 'v 的历史已完成：看文档', priority: 'low', difficulty: 'easy', status: 'done', createdAt: '2026-09-03', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
  ]
  for (const t of vTodos) {
    await db.insert(todos).values({ ...t, userId: vId })
  }

  // n's today todos
  const nId = USERS[0].id
  const nTodayTodos: Omit<typeof todos.$inferInsert, 'userId'>[] = [
    { id: 'nt1', horizon: 'today', title: 'n 的今日待办：整理文档', priority: 'high', difficulty: 'easy', status: 'todo', createdAt: '2026-09-06', dueDate: '2026-09-06', percentDone: 0, repeatAfter: 0, repeatMode: 0 },
    { id: 'nt2', horizon: 'today', title: 'n 的今日待办：检查代码', priority: 'medium', difficulty: 'medium', status: 'doing', createdAt: '2026-09-06', dueDate: '2026-09-06', percentDone: 60, repeatAfter: 0, repeatMode: 0 },
    { id: 'nt3', horizon: 'today', title: 'n 的今日待办：提交PR', priority: 'high', difficulty: 'hard', status: 'todo', createdAt: '2026-09-06', dueDate: '2026-09-06', percentDone: 0, repeatAfter: 0, repeatMode: 0 },
    // history done
    { id: 'nt4', title: 'n 的历史已完成：整理笔记', priority: 'high', difficulty: 'easy', status: 'done', createdAt: '2026-09-01', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
    { id: 'nt5', title: 'n 的历史已完成：写代码', priority: 'medium', difficulty: 'medium', status: 'done', createdAt: '2026-09-02', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
    { id: 'nt6', title: 'n 的历史已完成：看文档', priority: 'low', difficulty: 'easy', status: 'done', createdAt: '2026-09-03', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
    { id: 'nt7', title: 'n 的历史已完成：做测试', priority: 'high', difficulty: 'hard', status: 'done', createdAt: '2026-09-04', percentDone: 100, repeatAfter: 0, repeatMode: 0 },
  ]
  for (const t of nTodayTodos) {
    await db.insert(todos).values({ ...t, userId: nId })
  }

  // 示例：vt1 被 vt2 阻塞，vt2 关联 vt3
  await db.insert(taskRelations).values([
    { id: 'rel-1', taskId: 'vt2', otherTaskId: 'vt1', relationKind: 'blocking' },
    { id: 'rel-2', taskId: 'vt1', otherTaskId: 'vt3', relationKind: 'related' },
  ])
  // 示例：nt2 有提醒
  await db.insert(taskReminders).values({
    id: 'rem-1',
    taskId: 'nt2',
    dueDate: '2026-09-06 17:00',
    triggeredAt: null,
  })
  // 示例：nt1 有附件
  await db.insert(taskAttachments).values({
    id: 'att-1',
    taskId: 'nt1',
    fileUrl: 'https://example.com/doc.pdf',
    fileName: '需求文档.pdf',
    createdAt: '2026-09-06',
  })

  // Phase 2: 为 seedProjects 中的第一个项目创建默认视图
  const seedProject = seedProjects[0]
  if (seedProject) {
    const listViewId = `pv-seed-1`
    const kanbanViewId = `pv-seed-2`
    await db.insert(projectViews).values([
      { id: listViewId, projectId: seedProject.id, title: 'List', viewKind: 0, bucketConfigMode: 0, filter: null, position: 0 },
      { id: kanbanViewId, projectId: seedProject.id, title: 'Kanban', viewKind: 3, bucketConfigMode: 1, filter: null, position: 1 },
    ])
    for (const [i, title] of ['To Do', 'In Progress', 'Done'].entries()) {
      await db.insert(buckets).values({
        id: `bk-seed-${i}`,
        projectViewId: kanbanViewId,
        title,
        limit: 0,
        position: i,
      })
    }
  }

  // Phase 3: 创建一个示例团队
  const teamId = 'team-1'
  await db.insert(teams).values({
    id: teamId,
    name: 'Vikunja Team',
    description: 'Vikunja 开发团队',
    isPublic: 1,
    createdAt: '2026-09-01',
  })
  await db.insert(teamMembers).values([
    { id: 'tmember-1', teamId, userId: 'u-n', isAdmin: 1 },
    { id: 'tmember-2', teamId, userId: 'u-v', isAdmin: 0 },
  ])

  for (const r of seedResearch) {
    await db.insert(researchNotes).values({
      id: r.id,
      userId,
      title: r.title,
      teaser: r.teaser,
      body: r.body,
      stage: r.stage,
      tags: r.tags,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })
    for (const pid of r.projectIds) {
      await db.insert(researchNoteProjects).values({
        researchNoteId: r.id,
        projectId: pid,
      })
    }
  }

  for (const r of seedResources) {
    await db.insert(resources).values({
      id: r.id,
      userId,
      title: r.title,
      kind: r.kind,
      projectId: r.projectId ?? null,
      url: r.url ?? null,
      author: r.author ?? null,
      tags: r.tags,
      summary: r.summary ?? null,
      addedAt: r.addedAt,
      status: r.status,
    })
  }

  for (const i of seedInsights) {
    await db.insert(insights).values({
      id: i.id,
      userId,
      kind: i.kind,
      title: i.title,
      body: i.body,
      projectId: i.projectId ?? null,
      tags: i.tags,
      createdAt: i.createdAt,
    })
  }
}

// 直接执行：`tsx server/db/seed.ts`
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  seedDatabase()
    .then(() => {
      console.log('[seed] 完成 — 已写入演示用户 + 项目/todo/研究/资料/目标/感悟')
      process.exit(0)
    })
    .catch(err => {
      console.error('[seed] 失败', err)
      process.exit(1)
    })
}
