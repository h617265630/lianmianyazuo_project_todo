import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { researchNotes, researchNoteProjects } from '../db/schema'
import { toResearch } from '../db/mappers'
import { requireAuth } from '../middleware/auth'

export const researchRouter = Router()

async function loadResearch(userId: string) {
  const [rows, joins] = await Promise.all([
    db.select().from(researchNotes).where(eq(researchNotes.userId, userId)),
    db.select().from(researchNoteProjects),
  ])
  const projectIds = new Map<string, string[]>()
  rows.forEach(r => projectIds.set(r.id, []))
  joins.forEach(j => projectIds.get(j.researchNoteId)?.push(j.projectId))
  return rows.map(r => toResearch(r, projectIds.get(r.id) ?? []))
}

async function getResearch(userId: string, id: string) {
  const rows = await db
    .select()
    .from(researchNotes)
    .where(and(eq(researchNotes.id, id), eq(researchNotes.userId, userId)))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  const joins = await db
    .select()
    .from(researchNoteProjects)
    .where(eq(researchNoteProjects.researchNoteId, id))
  return toResearch(row, joins.map(j => j.projectId))
}

researchRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await loadResearch(req.userId!))
  } catch (e) {
    next(e)
  }
})

researchRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const note = await getResearch(req.userId!, String(req.params.id))
    if (!note) return res.status(404).json({ error: 'research not found' })
    res.json(note)
  } catch (e) {
    next(e)
  }
})

researchRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const now = new Date().toISOString().slice(0, 10)
    const projectIds: string[] = Array.isArray(req.body.projectIds) ? req.body.projectIds : []
    const inserted = await db
      .insert(researchNotes)
      .values({
        id: `rn-${Date.now()}`,
        userId: req.userId!,
        title: String(req.body.title ?? '').trim(),
        teaser: String(req.body.teaser ?? ''),
        body: String(req.body.body ?? ''),
        stage: req.body.stage ?? 'seedling',
        tags: Array.isArray(req.body.tags) ? req.body.tags : [],
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    const note = inserted[0]
    for (const pid of projectIds) {
      await db.insert(researchNoteProjects).values({
        researchNoteId: note.id,
        projectId: pid,
      })
    }
    res.status(201).json(toResearch(note, projectIds))
  } catch (e) {
    next(e)
  }
})

researchRouter.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const patch: Record<string, unknown> = {}
    const fields = ['title', 'teaser', 'body', 'stage', 'tags'] as const
    for (const f of fields) if (req.body[f] !== undefined) patch[f] = req.body[f]
    patch.updatedAt = new Date().toISOString().slice(0, 10)

    const updated = await db
      .update(researchNotes)
      .set(patch)
      .where(and(eq(researchNotes.id, String(req.params.id)), eq(researchNotes.userId, req.userId!)))
      .returning()
    if (!updated[0]) return res.status(404).json({ error: 'research not found' })

    let projectIds: string[]
    if (Array.isArray(req.body.projectIds)) {
      projectIds = req.body.projectIds
      await db
        .delete(researchNoteProjects)
        .where(eq(researchNoteProjects.researchNoteId, String(req.params.id)))
      for (const pid of projectIds) {
        await db.insert(researchNoteProjects).values({
          researchNoteId: String(req.params.id),
          projectId: pid,
        })
      }
    } else {
      const joins = await db
        .select()
        .from(researchNoteProjects)
        .where(eq(researchNoteProjects.researchNoteId, String(req.params.id)))
      projectIds = joins.map(j => j.projectId)
    }

    res.json(toResearch(updated[0], projectIds))
  } catch (e) {
    next(e)
  }
})

researchRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await db
      .delete(researchNotes)
      .where(and(eq(researchNotes.id, String(req.params.id)), eq(researchNotes.userId, req.userId!)))
    res.status(204).end()
  } catch (e) {
    next(e)
  }
})
