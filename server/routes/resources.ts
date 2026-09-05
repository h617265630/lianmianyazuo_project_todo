import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { resources } from '../db/schema'
import { toResource } from '../db/mappers'
import { requireAuth } from '../middleware/auth'

export const resourcesRouter = Router()

resourcesRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(resources).where(eq(resources.userId, req.userId!))
    res.json(rows.map(toResource))
  } catch (e) {
    next(e)
  }
})

resourcesRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const now = new Date().toISOString().slice(0, 10)
    const inserted = await db
      .insert(resources)
      .values({
        id: `r-${Date.now()}`,
        userId: req.userId!,
        title: String(req.body.title ?? '').trim(),
        kind: req.body.kind ?? 'note',
        projectId: req.body.projectId || null,
        url: req.body.url || null,
        author: req.body.author || null,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        summary: req.body.summary || null,
        addedAt: now,
        status: req.body.status ?? 'unread',
      })
      .returning()
    res.status(201).json(toResource(inserted[0]))
  } catch (e) {
    next(e)
  }
})

resourcesRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const patch: Record<string, unknown> = {}
    const fields = ['title', 'kind', 'projectId', 'url', 'author', 'tags', 'summary', 'status'] as const
    for (const f of fields) if (req.body[f] !== undefined) patch[f] = req.body[f]
    const updated = await db
      .update(resources)
      .set(patch)
      .where(and(eq(resources.id, String(req.params.id)), eq(resources.userId, req.userId!)))
      .returning()
    if (!updated[0]) return res.status(404).json({ error: 'resource not found' })
    res.json(toResource(updated[0]))
  } catch (e) {
    next(e)
  }
})

resourcesRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(resources)
      .where(and(eq(resources.id, String(req.params.id)), eq(resources.userId, req.userId!)))
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})
