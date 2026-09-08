import { Router } from 'express'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { db } from '../db'
import {
  projects,
  projectObjectives,
  projectKeyResults,
  projectMilestones,
  projectCheckins,
  projectViews,
  buckets,
  taskPositions,
  taskBuckets,
} from '../db/schema'
import { toProject } from '../db/mappers'
import { requireAuth } from '../middleware/auth'
import type { Objective } from '../../src/types'

export const projectsRouter = Router()

type MilestoneRow = (typeof projectMilestones)['$inferSelect']
type CheckinRow = (typeof projectCheckins)['$inferSelect']
type ObjectiveRow = (typeof projectObjectives)['$inferSelect']
type KeyResultRow = (typeof projectKeyResults)['$inferSelect']

function groupByProject<T extends { projectId: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>()
  rows.forEach(r => {
    if (!m.has(r.projectId)) m.set(r.projectId, [])
    m.get(r.projectId)!.push(r)
  })
  return m
}

function groupByObjective<T extends { objectiveId: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>()
  rows.forEach(r => {
    if (!m.has(r.objectiveId)) m.set(r.objectiveId, [])
    m.get(r.objectiveId)!.push(r)
  })
  return m
}

function buildObjectives(oRows: ObjectiveRow[], krRows: KeyResultRow[]): Map<string, Objective[]> {
  const krs = groupByObjective(krRows)
  const byProject = new Map<string, Objective[]>()
  oRows.forEach(o => {
    const keyResults = (krs.get(o.id) ?? []).map(kr => ({
      id: kr.id,
      title: kr.title,
      progress: kr.progress,
    }))
    const arr = byProject.get(o.projectId) ?? []
    arr.push({ id: o.id, title: o.title, keyResults })
    byProject.set(o.projectId, arr)
  })
  return byProject
}

async function loadProjects(userId?: string) {
  const pRows = userId
    ? await db.select().from(projects).where(eq(projects.userId, userId))
    : await db.select().from(projects)
  if (pRows.length === 0) return []
  const pIds = pRows.map(p => p.id)
  const [mRows, cRows, oRows] = await Promise.all([
    db.select().from(projectMilestones).where(inArray(projectMilestones.projectId, pIds)),
    db.select().from(projectCheckins).where(inArray(projectCheckins.projectId, pIds)).orderBy(desc(projectCheckins.date)),
    db.select().from(projectObjectives).where(inArray(projectObjectives.projectId, pIds)),
  ])
  const oIds = oRows.map(o => o.id)
  const krRows = oIds.length
    ? await db.select().from(projectKeyResults).where(inArray(projectKeyResults.objectiveId, oIds))
    : []

  const milestones = groupByProject(mRows)
  const checkins = groupByProject(cRows)
  const objectives = buildObjectives(oRows, krRows)

  return pRows.map(p =>
    toProject(
      p,
      milestones.get(p.id) ?? [],
      checkins.get(p.id) ?? [],
      objectives.get(p.id) ?? [],
    ),
  )
}

async function getProject(userId: string, id: string) {
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  const [m, c, o] = await Promise.all([
    db.select().from(projectMilestones).where(eq(projectMilestones.projectId, id)),
    db.select().from(projectCheckins).where(eq(projectCheckins.projectId, id)).orderBy(desc(projectCheckins.date)),
    db.select().from(projectObjectives).where(eq(projectObjectives.projectId, id)),
  ])
  const oIds = o.map(x => x.id)
  const kr = oIds.length
    ? await db.select().from(projectKeyResults).where(inArray(projectKeyResults.objectiveId, oIds))
    : []
  const objectives = buildObjectives(o, kr).get(id) ?? []
  return toProject(row, m, c, objectives)
}

async function ownsProject(userId: string, projectId: string) {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  return rows.length > 0
}

async function ownsObjective(userId: string, objectiveId: string) {
  const rows = await db
    .select({ id: projectObjectives.id })
    .from(projectObjectives)
    .innerJoin(projects, eq(projectObjectives.projectId, projects.id))
    .where(and(eq(projectObjectives.id, objectiveId), eq(projects.userId, userId)))
    .limit(1)
  return rows.length > 0
}

async function ownsKeyResult(userId: string, keyResultId: string) {
  const rows = await db
    .select({ id: projectKeyResults.id })
    .from(projectKeyResults)
    .innerJoin(projectObjectives, eq(projectKeyResults.objectiveId, projectObjectives.id))
    .innerJoin(projects, eq(projectObjectives.projectId, projects.id))
    .where(and(eq(projectKeyResults.id, keyResultId), eq(projects.userId, userId)))
    .limit(1)
  return rows.length > 0
}

projectsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await loadProjects())
  } catch (e) {
    next(e)
  }
})

// 创建项目（自动创建 list + kanban 默认视图）
projectsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      name, tagline, description, status, phase, progress,
      startDate, localPath, repoUrl, liveUrl, conditions, bottlenecks,
      references, learning, tags, accent, parentProjectId,
    } = req.body
    if (!name || !tagline || !description || !startDate || !localPath) {
      return res.status(400).json({ error: 'name, tagline, description, startDate, localPath are required' })
    }
    const projectId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await db.insert(projects).values({
      id: projectId,
      userId: req.userId!,
      name: String(name).trim(),
      tagline: String(tagline).trim(),
      description: String(description).trim(),
      status: status ?? 'planning',
      phase: phase ?? 'exploring',
      progress: progress ?? 0,
      startDate,
      localPath,
      repoUrl: repoUrl || null,
      liveUrl: liveUrl || null,
      conditions: Array.isArray(conditions) ? conditions : [],
      bottlenecks: Array.isArray(bottlenecks) ? bottlenecks : [],
      references: Array.isArray(references) ? references : [],
      learning: Array.isArray(learning) ? learning : [],
      tags: Array.isArray(tags) ? tags : [],
      accent: accent ?? 'stone',
      parentProjectId: parentProjectId || null,
    })

    // 自动创建默认视图：list (0) + kanban (3)
    const listViewId = `pv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const kanbanViewId = `pv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.insert(projectViews).values([
      { id: listViewId, projectId, title: 'List', viewKind: 0, bucketConfigMode: 0, filter: null, position: 0 },
      { id: kanbanViewId, projectId, title: 'Kanban', viewKind: 3, bucketConfigMode: 1, filter: null, position: 1 },
    ])
    // kanban 默认三列
    for (const [i, title] of ['To Do', 'In Progress', 'Done'].entries()) {
      await db.insert(buckets).values({
        id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectViewId: kanbanViewId,
        title,
        limit: 0,
        position: i,
      })
    }

    const project = await getProject(req.userId!, projectId)
    res.status(201).json(project)
  } catch (e) { next(e) }
})

projectsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await getProject(req.userId!, String(req.params.id))
    if (!project) return res.status(404).json({ error: 'project not found' })
    res.json(project)
  } catch (e) {
    next(e)
  }
})

projectsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const patch: Record<string, unknown> = {}
    if (req.body.status !== undefined) patch.status = req.body.status
    if (req.body.phase !== undefined) patch.phase = req.body.phase
    if (req.body.progress !== undefined) patch.progress = req.body.progress
    await db.update(projects).set(patch).where(eq(projects.id, String(req.params.id)))
    const project = await getProject(req.userId!, String(req.params.id))
    res.json(project)
  } catch (e) {
    next(e)
  }
})

projectsRouter.post('/:id/checkins', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const note = String(req.body.note ?? '').trim()
    if (!note) return res.status(400).json({ error: 'note is required' })
    const today = new Date().toISOString().slice(0, 10)
    await db.insert(projectCheckins).values({
      id: `c-${Date.now()}`,
      projectId: String(req.params.id),
      date: today,
      note,
    })
    const project = await getProject(req.userId!, String(req.params.id))
    res.status(201).json(project)
  } catch (e) {
    next(e)
  }
})

projectsRouter.post('/:id/objectives', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const title = String(req.body.title ?? '').trim()
    if (!title) return res.status(400).json({ error: 'title is required' })
    await db.insert(projectObjectives).values({
      id: `o-${Date.now()}`,
      projectId: String(req.params.id),
      title,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    const project = await getProject(req.userId!, String(req.params.id))
    res.status(201).json(project)
  } catch (e) {
    next(e)
  }
})

projectsRouter.post('/objectives/:id/key-results', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsObjective(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'objective not found' })
    }
    const title = String(req.body.title ?? '').trim()
    if (!title) return res.status(400).json({ error: 'title is required' })
    const progress = Math.max(0, Math.min(100, Number(req.body.progress ?? 0) || 0))
    await db.insert(projectKeyResults).values({
      id: `kr-${Date.now()}`,
      objectiveId: String(req.params.id),
      title,
      progress,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    res.status(201).json({ ok: true })
  } catch (e) {
    next(e)
  }
})

projectsRouter.patch('/key-results/:id', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsKeyResult(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'key result not found' })
    }
    const patch: Record<string, unknown> = {}
    if (req.body.title !== undefined) patch.title = String(req.body.title ?? '').trim()
    if (req.body.progress !== undefined) {
      patch.progress = Math.max(0, Math.min(100, Number(req.body.progress) || 0))
    }
    await db.update(projectKeyResults).set(patch).where(eq(projectKeyResults.id, String(req.params.id)))
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

projectsRouter.delete('/objectives/:id', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsObjective(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'objective not found' })
    }
    await db.delete(projectObjectives).where(eq(projectObjectives.id, String(req.params.id)))
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})

// ---------- Project Views ----------

// 获取项目的所有视图
projectsRouter.get('/:id/views', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const views = await db
      .select().from(projectViews)
      .where(eq(projectViews.projectId, String(req.params.id)))
      .orderBy(projectViews.position)
    // 每个视图带 buckets
    const result = await Promise.all(views.map(async (v) => {
      const bs = await db.select().from(buckets).where(eq(buckets.projectViewId, v.id)).orderBy(buckets.position)
      return { ...v, buckets: bs }
    }))
    res.json(result)
  } catch (e) { next(e) }
})

// 创建视图（默认 list + kanban 两个）
projectsRouter.post('/:id/views', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const { title, viewKind = 0, bucketConfigMode = 0, initialBuckets } = req.body
    const projectId = String(req.params.id)
    const id = `pv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await db.insert(projectViews).values({
      id,
      projectId,
      title: title ?? 'New View',
      viewKind: viewKind ?? 0,
      bucketConfigMode: bucketConfigMode ?? 0,
      filter: null,
      position: 0,
    })
    // 如果是 kanban view 且提供了初始列，创建它们
    if (viewKind === 3 && Array.isArray(initialBuckets)) {
      for (const b of initialBuckets) {
        await db.insert(buckets).values({
          id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          projectViewId: id,
          title: b.title,
          limit: b.limit ?? 0,
          position: b.position ?? 0,
        })
      }
    }
    const bs = await db.select().from(buckets).where(eq(buckets.projectViewId, id)).orderBy(buckets.position)
    const [view] = await db.select().from(projectViews).where(eq(projectViews.id, id)).limit(1)
    res.status(201).json({ ...view, buckets: bs })
  } catch (e) { next(e) }
})

// 更新视图
projectsRouter.patch('/views/:viewId', requireAuth, async (req, res, next) => {
  try {
    const [view] = await db.select().from(projectViews).where(eq(projectViews.id, String(req.params.viewId))).limit(1)
    if (!view) return res.status(404).json({ error: 'view not found' })
    if (!(await ownsProject(req.userId!, view.projectId))) {
      return res.status(404).json({ error: 'view not found' })
    }
    const patch: Record<string, unknown> = {}
    const fields = ['title', 'viewKind', 'filter', 'position', 'bucketConfigMode'] as const
    for (const f of fields) if (req.body[f] !== undefined) patch[f] = req.body[f]
    await db.update(projectViews).set(patch).where(eq(projectViews.id, String(req.params.viewId)))
    const bs = await db.select().from(buckets).where(eq(buckets.projectViewId, view.id)).orderBy(buckets.position)
    const [updated] = await db.select().from(projectViews).where(eq(projectViews.id, view.id)).limit(1)
    res.json({ ...updated, buckets: bs })
  } catch (e) { next(e) }
})

// 删除视图
projectsRouter.delete('/views/:viewId', requireAuth, async (req, res, next) => {
  try {
    const [view] = await db.select().from(projectViews).where(eq(projectViews.id, String(req.params.viewId))).limit(1)
    if (!view) return res.status(404).json({ error: 'view not found' })
    if (!(await ownsProject(req.userId!, view.projectId))) {
      return res.status(404).json({ error: 'view not found' })
    }
    await db.delete(projectViews).where(eq(projectViews.id, String(req.params.viewId)))
    res.status(204).end()
  } catch (e) { next(e) }
})

// ---------- Buckets ----------

// 添加看板列
projectsRouter.post('/views/:viewId/buckets', requireAuth, async (req, res, next) => {
  try {
    const [view] = await db.select().from(projectViews).where(eq(projectViews.id, String(req.params.viewId))).limit(1)
    if (!view) return res.status(404).json({ error: 'view not found' })
    if (!(await ownsProject(req.userId!, view.projectId))) {
      return res.status(404).json({ error: 'view not found' })
    }
    const { title, limit = 0, position = 0 } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    const inserted = await db.insert(buckets).values({
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectViewId: view.id,
      title: String(title).trim(),
      limit,
      position,
    }).returning()
    res.status(201).json(inserted[0])
  } catch (e) { next(e) }
})

// 更新看板列
projectsRouter.patch('/views/:viewId/buckets/:bucketId', requireAuth, async (req, res, next) => {
  try {
    const [bucket] = await db.select().from(buckets).where(eq(buckets.id, String(req.params.bucketId))).limit(1)
    if (!bucket) return res.status(404).json({ error: 'bucket not found' })
    const [view] = await db.select().from(projectViews).where(eq(projectViews.id, bucket.projectViewId)).limit(1)
    if (!(await ownsProject(req.userId!, view.projectId))) {
      return res.status(404).json({ error: 'bucket not found' })
    }
    const patch: Record<string, unknown> = {}
    const fields = ['title', 'limit', 'position'] as const
    for (const f of fields) if (req.body[f] !== undefined) patch[f] = req.body[f]
    await db.update(buckets).set(patch).where(eq(buckets.id, String(req.params.bucketId)))
    const [updated] = await db.select().from(buckets).where(eq(buckets.id, String(req.params.bucketId))).limit(1)
    res.json(updated)
  } catch (e) { next(e) }
})

// 删除看板列
projectsRouter.delete('/views/:viewId/buckets/:bucketId', requireAuth, async (req, res, next) => {
  try {
    const [bucket] = await db.select().from(buckets).where(eq(buckets.id, String(req.params.bucketId))).limit(1)
    if (!bucket) return res.status(404).json({ error: 'bucket not found' })
    const [view] = await db.select().from(projectViews).where(eq(projectViews.id, bucket.projectViewId)).limit(1)
    if (!(await ownsProject(req.userId!, view.projectId))) {
      return res.status(404).json({ error: 'bucket not found' })
    }
    await db.delete(buckets).where(eq(buckets.id, String(req.params.bucketId)))
    res.status(204).end()
  } catch (e) { next(e) }
})
