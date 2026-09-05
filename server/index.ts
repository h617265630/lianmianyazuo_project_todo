import 'dotenv/config'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { projectsRouter } from './routes/projects'
import { todosRouter } from './routes/todos'
import { researchRouter } from './routes/research'
import { resourcesRouter } from './routes/resources'
import { insightsRouter } from './routes/insights'
import { teamsRouter } from './routes/teams'
import { requireAuth } from './middleware/auth'
import { seedDatabase } from './db/seed'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() })
})

app.use('/api/auth', authRouter)

// Public: get all open todos from all users (for home page)
app.get('/api/todos/open', async (_req, res, next) => {
  try {
    const { ne } = await import('drizzle-orm')
    const { db } = await import('./db')
    const { todos } = await import('./db/schema')
    const { toTodo } = await import('./db/mappers')
    const rows = await db.select().from(todos).where(ne(todos.status, 'done'))
    res.json(rows.map(toTodo))
  } catch (e) {
    next(e)
  }
})

// Public: get all done todos from all users (for history)
app.get('/api/todos/done', async (_req, res, next) => {
  try {
    const { eq } = await import('drizzle-orm')
    const { db } = await import('./db')
    const { todos } = await import('./db/schema')
    const { toTodo } = await import('./db/mappers')
    const rows = await db.select().from(todos).where(eq(todos.status, 'done'))
    res.json(rows.map(toTodo))
  } catch (e) {
    next(e)
  }
})

// Public: create a todo (for home page, accepts userId in body)
app.post('/api/todos/public', async (req, res, next) => {
  try {
    const { userId, title, priority, difficulty, horizon, dueDate } = req.body
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title are required' })
    }
    const now = new Date().toISOString().slice(0, 10)
    const { db } = await import('./db')
    const { todos } = await import('./db/schema')
    const { toTodo } = await import('./db/mappers')
    const inserted = await db.insert(todos).values({
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: String(userId),
      title: String(title).trim(),
      priority: priority || 'medium',
      difficulty: difficulty || 'medium',
      status: 'todo',
      horizon: horizon || 'today',
      dueDate: dueDate || null,
      createdAt: now,
    }).returning()
    res.status(201).json(toTodo(inserted[0]))
  } catch (e) {
    next(e)
  }
})

app.use('/api/projects', requireAuth, projectsRouter)
app.use('/api/todos', requireAuth, todosRouter)
app.use('/api/research', requireAuth, researchRouter)
app.use('/api/resources', requireAuth, resourcesRouter)
app.use('/api/insights', requireAuth, insightsRouter)
app.use('/api/teams', requireAuth, teamsRouter)

app.post('/api/reset', async (_req, res, next) => {
  try {
    await seedDatabase()
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api] error', err)
  res.status(500).json({ error: 'internal error' })
})

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`[api] 连绵雅座 backend → http://localhost:${port}`)
})
