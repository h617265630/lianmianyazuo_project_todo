import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { insights } from '../db/schema'
import { toInsight } from '../db/mappers'
import { requireAuth } from '../middleware/auth'

export const insightsRouter = Router()

insightsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(insights).where(eq(insights.userId, req.userId!))
    res.json(rows.map(toInsight))
  } catch (e) {
    next(e)
  }
})

insightsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const now = new Date().toISOString().slice(0, 10)
    const inserted = await db
      .insert(insights)
      .values({
        id: `i-${Date.now()}`,
        userId: req.userId!,
        kind: req.body.kind === 'insight' ? 'insight' : 'method',
        title: String(req.body.title ?? '').trim(),
        body: String(req.body.body ?? ''),
        projectId: req.body.projectId || null,
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        createdAt: now,
      })
      .returning()
    res.status(201).json(toInsight(inserted[0]))
  } catch (e) {
    next(e)
  }
})

insightsRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const patch: Record<string, unknown> = {}
    const fields = ['kind', 'title', 'body', 'projectId', 'tags'] as const
    for (const f of fields) if (req.body[f] !== undefined) patch[f] = req.body[f]
    const updated = await db
      .update(insights)
      .set(patch)
      .where(and(eq(insights.id, String(req.params.id)), eq(insights.userId, req.userId!)))
      .returning()
    if (!updated[0]) return res.status(404).json({ error: 'insight not found' })
    res.json(toInsight(updated[0]))
  } catch (e) {
    next(e)
  }
})

insightsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(insights)
      .where(and(eq(insights.id, String(req.params.id)), eq(insights.userId, req.userId!)))
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})
