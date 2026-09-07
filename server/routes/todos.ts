import { localDate, validateRange } from '../../src/utils/todoSchedule'
import { Router } from 'express'
import { normalizeTodoPatch } from '../validation/todo'
import { eq, and, ne, inArray } from 'drizzle-orm'
import { db } from '../db'
import { projects, todos, taskRelations, taskReminders, taskAttachments, taskComments } from '../db/schema'
import { toTodo } from '../db/mappers'
import { requireAuth } from '../middleware/auth'

export const todosRouter = Router()

// 关联项目与父待办必须属于当前用户；空项目表示独立待办。
todosRouter.use(async (req, res, next) => {
  if (!['POST', 'PATCH'].includes(req.method) || !/^\/[^/]*$/.test(req.path)) return next()
  try {
    let patch: Record<string, unknown>
    try { patch = normalizeTodoPatch(req.body, req.method === 'POST') }
    catch (error) { return res.status(400).json({ error: (error as Error).message }) }
    if (req.method === 'PATCH' && !Object.keys(patch).length) return res.status(400).json({ error: '没有可更新的字段' })
    if (patch.projectId) {
      const rows = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, patch.projectId as string), eq(projects.userId, req.userId!))).limit(1)
      if (!rows.length) return res.status(400).json({ error: '关联项目不存在或不属于当前用户' })
    }
    if (patch.parentId) {
      if (patch.parentId === req.params.id || patch.parentId === req.path.slice(1)) return res.status(400).json({ error: '不能将待办自身设为父待办' })
      const rows = await db.select({ id: todos.id }).from(todos).where(and(eq(todos.id, patch.parentId as string), eq(todos.userId, req.userId!))).limit(1)
      if (!rows.length) return res.status(400).json({ error: '父待办不存在或不属于当前用户' })
    }
    req.body = patch
    next()
  } catch (error) { next(error) }
})

// 获取所有 open todos（首页用，公开）
todosRouter.get('/open', async (_req, res, next) => {
  try {
    const rows = await db.select().from(todos).where(ne(todos.status, 'done'))
    res.json(rows.map(toTodo))
  } catch (e) { next(e) }
})

// 获取所有 done todos（历史，公开）
todosRouter.get('/done', async (_req, res, next) => {
  try {
    const rows = await db.select().from(todos).where(eq(todos.status, 'done'))
    res.json(rows.map(toTodo))
  } catch (e) { next(e) }
})

// 获取当前用户的 todos
todosRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(todos).where(eq(todos.userId, req.userId!))
    res.json(rows.map(toTodo))
  } catch (e) { next(e) }
})

// 获取单个 todo（包含关联数据）
todosRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select().from(todos)
      .where(and(eq(todos.id, String(req.params.id)), eq(todos.userId, req.userId!)))
      .limit(1)
    if (!rows[0]) return res.status(404).json({ error: 'todo not found' })
    const row = rows[0]
    const [relations, reminders, attachments, comments] = await Promise.all([
      db.select().from(taskRelations).where(eq(taskRelations.taskId, row.id)),
      db.select().from(taskReminders).where(eq(taskReminders.taskId, row.id)),
      db.select().from(taskAttachments).where(eq(taskAttachments.taskId, row.id)),
      db.select().from(taskComments).where(eq(taskComments.taskId, row.id)),
    ])
    res.json({ ...toTodo(row), relations, reminders, attachments, comments })
  } catch (e) { next(e) }
})

// 创建 todo
todosRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const now = localDate()
    const inserted = await db
      .insert(todos)
      .values({
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: req.userId!,
        title: String(req.body.title ?? '').trim(),
        detail: req.body.detail || null,
        projectId: req.body.projectId || null,
        parentId: req.body.parentId || null,
        priority: req.body.priority ?? 'medium',
        difficulty: req.body.difficulty ?? 'medium',
        status: req.body.status ?? 'todo',
        horizon: req.body.horizon ?? 'week',
        dueDate: req.body.dueDate || null,
        createdAt: now,
        percentDone: req.body.percentDone ?? 0,
        repeatAfter: req.body.repeatAfter ?? 0,
        repeatMode: req.body.repeatMode ?? 0,
        startDate: req.body.startDate || null,
        hexColor: req.body.hexColor || null,
      })
      .returning()
    res.status(201).json(toTodo(inserted[0]))
  } catch (e) { next(e) }
})

// 更新 todo
todosRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const patch: Record<string, unknown> = {}
    const fields = [
      'title', 'detail', 'projectId', 'parentId', 'priority', 'difficulty',
      'status', 'horizon', 'dueDate', 'percentDone', 'repeatAfter', 'repeatMode',
      'startDate', 'hexColor',
    ] as const
    for (const f of fields) if (req.body[f] !== undefined) patch[f] = req.body[f]
    const existing = await db.select().from(todos).where(and(eq(todos.id, String(req.params.id)), eq(todos.userId, req.userId!))).limit(1)
    if (!existing[0]) return res.status(404).json({ error: 'todo not found' })
    const merged = { ...existing[0], ...patch }
    try { validateRange(merged.startDate as string | null, merged.dueDate as string | null) }
    catch (error) { return res.status(400).json({ error: (error as Error).message }) }
    const updated = await db
      .update(todos)
      .set(patch)
      .where(and(eq(todos.id, String(req.params.id)), eq(todos.userId, req.userId!)))
      .returning()
    if (!updated[0]) return res.status(404).json({ error: 'todo not found' })
    res.json(toTodo(updated[0]))
  } catch (e) { next(e) }
})

// 删除 todo
todosRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await db
      .delete(todos)
      .where(and(eq(todos.id, String(req.params.id)), eq(todos.userId, req.userId!)))
      .returning({ id: todos.id })
    if (!deleted.length) return res.status(404).json({ error: '待办不存在或无权删除' })
    res.status(204).end()
  } catch (e) { next(e) }
})

// 子资源也必须先验证待办归属。
todosRouter.use('/:id', requireAuth, async (req, res, next) => {
  try {
    const owned = await db.select({ id: todos.id }).from(todos).where(and(eq(todos.id, String(req.params.id)), eq(todos.userId, req.userId!))).limit(1)
    if (!owned.length) return res.status(404).json({ error: '待办不存在或无权访问' })
    next()
  } catch (error) { next(error) }
})

// ---------- Relations ----------

// 获取任务关系
todosRouter.get('/:id/relations', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select().from(taskRelations)
      .where(eq(taskRelations.taskId, String(req.params.id)))
    res.json(rows)
  } catch (e) { next(e) }
})

// 添加任务关系
todosRouter.post('/:id/relations', requireAuth, async (req, res, next) => {
  try {
    const { otherTaskId, relationKind } = req.body
    if (!otherTaskId || !relationKind) {
      return res.status(400).json({ error: 'otherTaskId and relationKind are required' })
    }
    const other = await db.select({ id: todos.id }).from(todos).where(and(eq(todos.id, String(otherTaskId)), eq(todos.userId, req.userId!))).limit(1)
    if (!other.length) return res.status(400).json({ error: '关联待办不存在或无权访问' })
    const inserted = await db
      .insert(taskRelations)
      .values({
        id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        taskId: String(req.params.id),
        otherTaskId: String(otherTaskId),
        relationKind,
      })
      .returning()
    res.status(201).json(inserted[0])
  } catch (e) { next(e) }
})

// 删除任务关系
todosRouter.delete('/:id/relations/:relationId', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(taskRelations)
      .where(and(eq(taskRelations.id, String(req.params.relationId)), eq(taskRelations.taskId, String(req.params.id))))
    res.status(204).end()
  } catch (e) { next(e) }
})

// ---------- Reminders ----------

// 获取提醒
todosRouter.get('/:id/reminders', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select().from(taskReminders)
      .where(eq(taskReminders.taskId, String(req.params.id)))
    res.json(rows)
  } catch (e) { next(e) }
})

// 添加提醒
todosRouter.post('/:id/reminders', requireAuth, async (req, res, next) => {
  try {
    const { dueDate } = req.body
    if (!dueDate) return res.status(400).json({ error: 'dueDate is required' })
    const inserted = await db
      .insert(taskReminders)
      .values({
        id: `tmr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        taskId: String(req.params.id),
        dueDate: String(dueDate),
        triggeredAt: null,
      })
      .returning()
    res.status(201).json(inserted[0])
  } catch (e) { next(e) }
})

// 删除提醒
todosRouter.delete('/:id/reminders/:reminderId', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(taskReminders)
      .where(and(eq(taskReminders.id, String(req.params.reminderId)), eq(taskReminders.taskId, String(req.params.id))))
    res.status(204).end()
  } catch (e) { next(e) }
})

// ---------- Attachments ----------

// 获取附件
todosRouter.get('/:id/attachments', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select().from(taskAttachments)
      .where(eq(taskAttachments.taskId, String(req.params.id)))
    res.json(rows)
  } catch (e) { next(e) }
})

// 添加附件
todosRouter.post('/:id/attachments', requireAuth, async (req, res, next) => {
  try {
    const { fileUrl, fileName } = req.body
    if (!fileUrl || !fileName) return res.status(400).json({ error: 'fileUrl and fileName are required' })
    const now = new Date().toISOString().slice(0, 10)
    const inserted = await db
      .insert(taskAttachments)
      .values({
        id: `ta-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        taskId: String(req.params.id),
        fileUrl: String(fileUrl),
        fileName: String(fileName),
        createdAt: now,
      })
      .returning()
    res.status(201).json(inserted[0])
  } catch (e) { next(e) }
})

// 删除附件
todosRouter.delete('/:id/attachments/:attachmentId', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(taskAttachments)
      .where(and(eq(taskAttachments.id, String(req.params.attachmentId)), eq(taskAttachments.taskId, String(req.params.id))))
    res.status(204).end()
  } catch (e) { next(e) }
})

// ---------- Comments ----------

// 获取评注
todosRouter.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select().from(taskComments)
      .where(eq(taskComments.taskId, String(req.params.id)))
    res.json(rows)
  } catch (e) { next(e) }
})

// 添加评注
todosRouter.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { body } = req.body
    if (!body) return res.status(400).json({ error: 'body is required' })
    const now = new Date().toISOString().slice(0, 10)
    const inserted = await db
      .insert(taskComments)
      .values({
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        taskId: String(req.params.id),
        userId: req.userId!,
        body: String(body).trim(),
        createdAt: now,
      })
      .returning()
    res.status(201).json(inserted[0])
  } catch (e) { next(e) }
})

// 删除评注
todosRouter.delete('/:id/comments/:commentId', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(taskComments)
      .where(and(eq(taskComments.id, String(req.params.commentId)), eq(taskComments.taskId, String(req.params.id))))
    res.status(204).end()
  } catch (e) { next(e) }
})
