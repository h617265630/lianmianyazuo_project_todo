import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { teams, teamMembers, projectUsers, teamProjects, projects } from '../db/schema'
import { requireAuth } from '../middleware/auth'

export const teamsRouter = Router()

async function ownsProject(userId: string, projectId: string) {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  return rows.length > 0
}

// ---------- Teams ----------

// 获取我的团队列表
teamsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const memberships = await db
      .select().from(teamMembers)
      .where(eq(teamMembers.userId, req.userId!))
    if (memberships.length === 0) return res.json([])
    const teamIds = memberships.map(m => m.teamId)
    const rows = await db.select().from(teams).where(eq(teams.id, teamIds[0]))
    res.json(rows.map(t => ({ ...t, isAdmin: memberships.find(m => m.teamId === t.id)?.isAdmin ?? false })))
  } catch (e) { next(e) }
})

// 创建团队
teamsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })
    const teamId = `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await db.insert(teams).values({
      id: teamId,
      name: String(name).trim(),
      description: description ? String(description) : null,
      isPublic: isPublic ? 1 : 0,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    await db.insert(teamMembers).values({
      id: `tmember-${Date.now()}`,
      teamId,
      userId: req.userId!,
      isAdmin: 1,
    })
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1)
    res.status(201).json({ ...team, isAdmin: true })
  } catch (e) { next(e) }
})

// 获取团队成员
teamsRouter.get('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const [team] = await db.select().from(teams).where(eq(teams.id, String(req.params.id))).limit(1)
    if (!team) return res.status(404).json({ error: 'team not found' })
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, team.id))
    res.json(members)
  } catch (e) { next(e) }
})

// 添加团队成员
teamsRouter.post('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const [team] = await db.select().from(teams).where(eq(teams.id, String(req.params.id))).limit(1)
    if (!team) return res.status(404).json({ error: 'team not found' })
    const [membership] = await db
      .select().from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, req.userId!)))
      .limit(1)
    if (!membership?.isAdmin) return res.status(403).json({ error: 'admin only' })
    const { userId, isAdmin } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })
    const id = `tmember-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await db.insert(teamMembers).values({
      id,
      teamId: team.id,
      userId: String(userId),
      isAdmin: isAdmin ? 1 : 0,
    }).onConflictDoNothing()
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1)
    res.status(201).json(member)
  } catch (e) { next(e) }
})

// 移除团队成员
teamsRouter.delete('/:id/members/:userId', requireAuth, async (req, res, next) => {
  try {
    const [team] = await db.select().from(teams).where(eq(teams.id, String(req.params.id))).limit(1)
    if (!team) return res.status(404).json({ error: 'team not found' })
    const [membership] = await db
      .select().from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, req.userId!)))
      .limit(1)
    if (!membership?.isAdmin) return res.status(403).json({ error: 'admin only' })
    await db.delete(teamMembers).where(
      and(eq(teamMembers.teamId, team.id), eq(teamMembers.userId, String(req.params.userId))),
    )
    res.status(204).end()
  } catch (e) { next(e) }
})

// ---------- Project Permissions ----------

// 授予用户项目权限
teamsRouter.post('/projects/:id/users', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const { userId, permission = 0 } = req.body
    if (!userId) return res.status(400).json({ error: 'userId is required' })
    const id = `pu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await db.insert(projectUsers).values({
      id,
      userId: String(userId),
      projectId: String(req.params.id),
      permission,
    }).onConflictDoNothing()
    const [pu] = await db.select().from(projectUsers).where(eq(projectUsers.id, id)).limit(1)
    res.status(201).json(pu)
  } catch (e) { next(e) }
})

// 移除用户项目权限
teamsRouter.delete('/projects/:id/users/:userId', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    await db.delete(projectUsers).where(eq(projectUsers.userId, String(req.params.userId)))
    res.status(204).end()
  } catch (e) { next(e) }
})

// 授予团队项目权限
teamsRouter.post('/projects/:id/teams', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    const { teamId, permission = 0 } = req.body
    if (!teamId) return res.status(400).json({ error: 'teamId is required' })
    const id = `tp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    await db.insert(teamProjects).values({
      id,
      teamId: String(teamId),
      projectId: String(req.params.id),
      permission,
    }).onConflictDoNothing()
    const [tp] = await db.select().from(teamProjects).where(eq(teamProjects.id, id)).limit(1)
    res.status(201).json(tp)
  } catch (e) { next(e) }
})

// 移除团队项目权限
teamsRouter.delete('/projects/:id/teams/:teamId', requireAuth, async (req, res, next) => {
  try {
    if (!(await ownsProject(req.userId!, String(req.params.id)))) {
      return res.status(404).json({ error: 'project not found' })
    }
    await db.delete(teamProjects).where(eq(teamProjects.teamId, String(req.params.teamId)))
    res.status(204).end()
  } catch (e) { next(e) }
})
