import { pathToFileURL } from 'node:url'
import { db } from './index'
import { todos } from './schema'

// 使用本地日期（用户视角的"今天"），不用 UTC
function localDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function localDateOffset(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return localDate(d)
}

const TODAY = localDate() // 本地时区的"今天"

async function main() {
  // 1) 清空 todos（FK-safe：先删子表）
  await db.delete(todos)
  console.log('[reset-todos] 已删除 todos 表全部数据')

  // 2) 插入今天的几条 todo
  const todayTodos: (typeof todos.$inferInsert)[] = [
    {
      id: `t-today-${Date.now()}-1`,
      userId: 'u-n',
      title: '今日待办 1：梳理今天的工作清单',
      priority: 'high',
      difficulty: 'easy',
      status: 'todo',
      horizon: 'today',
      dueDate: TODAY,
      createdAt: TODAY,
      percentDone: 0,
      repeatAfter: 0,
      repeatMode: 0,
      startDate: null,
      hexColor: null,
    },
    {
      id: `t-today-${Date.now()}-2`,
      userId: 'u-n',
      title: '今日待办 2：复盘昨天遗留的卡点',
      priority: 'medium',
      difficulty: 'medium',
      status: 'doing',
      horizon: 'today',
      dueDate: TODAY,
      createdAt: TODAY,
      percentDone: 30,
      repeatAfter: 0,
      repeatMode: 0,
      startDate: null,
      hexColor: null,
    },
    {
      id: `t-today-${Date.now()}-3`,
      userId: 'u-v',
      title: '今日待办：跑通一个新的动画 demo',
      priority: 'low',
      difficulty: 'easy',
      status: 'todo',
      horizon: 'today',
      dueDate: TODAY,
      createdAt: TODAY,
      percentDone: 0,
      repeatAfter: 0,
      repeatMode: 0,
      startDate: null,
      hexColor: null,
    },
  ]
  for (const t of todayTodos) {
    await db.insert(todos).values(t)
  }
  console.log(`[reset-todos] 已插入 ${todayTodos.length} 条今日 (${TODAY}) todo`)

  // 3) 插入以前的 todo（历史），使用相对"今天"的天数偏移
  const earlierTodos = [
    { daysAgo: 1, userId: 'u-n', title: '昨天的 todo：写周报', status: 'done' as const, percent: 100 },
    { daysAgo: 1, userId: 'u-n', title: '昨天的 todo：整理文档', status: 'done' as const, percent: 100 },
    { daysAgo: 2, userId: 'u-v', title: '前天的 todo：修一个 bug', status: 'done' as const, percent: 100 },
    { daysAgo: 4, userId: 'u-v', title: '4 天前的 todo：跑测试', status: 'doing' as const, percent: 60 },
    { daysAgo: 6, userId: 'u-n', title: '更早的 todo：重构组件', status: 'done' as const, percent: 100 },
  ]
  for (const t of earlierTodos) {
    const date = localDateOffset(t.daysAgo)
    await db.insert(todos).values({
      id: `t-old-${t.daysAgo}-${t.userId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: t.userId,
      title: t.title,
      priority: 'medium',
      difficulty: 'medium',
      status: t.status,
      horizon: 'week',
      dueDate: date,
      createdAt: date,
      percentDone: t.percent,
      repeatAfter: 0,
      repeatMode: 0,
      startDate: null,
      hexColor: null,
    })
  }
  console.log(`[reset-todos] 已插入 ${earlierTodos.length} 条历史 todo`)

  console.log('[reset-todos] 完成')
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[reset-todos] 失败', err)
      process.exit(1)
    })
}