import { validateRange, schedulePreset } from '../../src/utils/todoSchedule'
export function normalizeTodoPatch(input: Record<string, unknown>, creating = false) {
  const patch: Record<string, unknown> = {}
  const enums: Record<string, string[]> = {
    status: ['todo', 'doing', 'done'], priority: ['low', 'medium', 'high'],
    difficulty: ['easy', 'medium', 'hard'], horizon: ['today', 'week', 'month', 'long'],
  }
  if (creating || input.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim()) throw new Error('待办标题不能为空')
    patch.title = input.title.trim()
  }
  for (const [key, options] of Object.entries(enums)) {
    if (input[key] === undefined) continue
    if (!options.includes(input[key] as string)) throw new Error(`${key} 无效`)
    patch[key] = input[key]
  }
  for (const key of ['projectId', 'parentId', 'dueDate', 'startDate', 'detail', 'hexColor']) {
    if (input[key] === undefined) continue
    if (input[key] !== null && typeof input[key] !== 'string') throw new Error(`${key} 无效`)
    patch[key] = input[key] || null
  }
  for (const key of ['percentDone', 'repeatAfter', 'repeatMode']) {
    if (input[key] === undefined) continue
    if (typeof input[key] !== 'number' || !Number.isFinite(input[key]) || (input[key] as number) < 0) throw new Error(`${key} 无效`)
    patch[key] = input[key]
  }
  if (typeof patch.percentDone === 'number' && patch.percentDone > 100) throw new Error('进度必须在 0 到 100 之间')
  if (creating && !patch.startDate && !patch.dueDate && ['today', 'week'].includes((patch.horizon ?? 'week') as string)) {
    const range = schedulePreset((patch.horizon ?? 'week') as 'today' | 'week')
    patch.startDate = range.startDate
    patch.dueDate = range.dueDate
  }
  validateRange(patch.startDate as string | null, patch.dueDate as string | null)
  return patch
}
