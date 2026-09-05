import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { users } from '../db/schema'
import { toUser } from '../db/mappers'
import { hashPassword, verifyPassword } from '../auth/password'
import { signToken, requireAuth } from '../middleware/auth'

export const authRouter = Router()

authRouter.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const name = String(req.body.name ?? '').trim()
    const password = String(req.body.password ?? '')
    if (!email || !name || !password) {
      return res.status(400).json({ error: '邮箱、昵称、密码都必填' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 位' })
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing[0]) {
      return res.status(409).json({ error: '该邮箱已注册' })
    }

    const inserted = await db
      .insert(users)
      .values({
        id: `u-${Date.now()}`,
        email,
        name,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString().slice(0, 10),
      })
      .returning()
    const user = toUser(inserted[0])
    res.status(201).json({ token: signToken(user.id), user })
  } catch (e) {
    next(e)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const password = String(req.body.password ?? '')
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const row = rows[0]
    if (!row || !verifyPassword(password, row.passwordHash)) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }
    const user = toUser(row)
    res.json({ token: signToken(user.id), user })
  } catch (e) {
    next(e)
  }
})

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(users).where(eq(users.id, req.userId!)).limit(1)
    const row = rows[0]
    if (!row) return res.status(404).json({ error: '用户不存在' })
    res.json(toUser(row))
  } catch (e) {
    next(e)
  }
})
