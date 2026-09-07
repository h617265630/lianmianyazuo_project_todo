import type { Todo } from '../types'

export type ScheduleMode = 'today' | 'week' | 'custom'
export interface ScheduleDraft { mode: ScheduleMode; startDate: string; dueDate: string }
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function weekRange(today = localDate()) {
  const date = new Date(`${today}T12:00:00`)
  date.setDate(date.getDate() - (date.getDay() + 6) % 7)
  const startDate = localDate(date)
  date.setDate(date.getDate() + 6)
  return { startDate, dueDate: localDate(date) }
}
export function schedulePreset(mode: ScheduleMode = 'today', today = localDate()): ScheduleDraft {
  return { mode, ...(mode === 'week' ? weekRange(today) : { startDate: today, dueDate: today }) }
}
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function validateRange(start?: string | null, end?: string | null) {
  if ((start && !validDate(start)) || (end && !validDate(end))) throw new Error('请输入有效日期')
  if (start && end && start > end) throw new Error('结束日期不能早于开始日期')
}
export function schedulePatch(draft: ScheduleDraft) {
  const range = draft.mode === 'custom' ? draft : schedulePreset(draft.mode)
  if (!range.startDate || !range.dueDate) throw new Error('请选择开始日期和结束日期')
  validateRange(range.startDate, range.dueDate)
  return { startDate: range.startDate, dueDate: range.dueDate, horizon: draft.mode === 'custom' ? 'long' as const : draft.mode }
}
// 兼容旧任务：优先使用实际日期；没有日期的旧今日/本周任务按创建日定位。
export function todoRange(task: Pick<Todo, 'startDate' | 'dueDate' | 'horizon' | 'createdAt'>) {
  if (task.startDate || task.dueDate) return { startDate: task.startDate || task.dueDate!, dueDate: task.dueDate || task.startDate! }
  if (task.horizon === 'today') return { startDate: task.createdAt, dueDate: task.createdAt }
  if (task.horizon === 'week') return weekRange(task.createdAt)
  return null
}
export function overlapsRange(task: Pick<Todo, 'startDate' | 'dueDate' | 'horizon' | 'createdAt'>, start: string, end: string) {
  if (!validDate(start) || !validDate(end) || start > end) return false
  const range = todoRange(task)
  return !!range && range.startDate <= end && range.dueDate >= start
}
export function scheduleLabel(task: Pick<Todo, 'startDate' | 'dueDate' | 'horizon' | 'createdAt'>) {
  const range = todoRange(task)
  if (!range) return '未安排日期'
  return range.startDate === range.dueDate ? range.startDate : `${range.startDate} ～ ${range.dueDate}`
}
