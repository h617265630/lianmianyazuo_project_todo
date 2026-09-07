import test from 'node:test'
import assert from 'node:assert/strict'
import { weekRange, schedulePreset, schedulePatch, overlapsRange, validateRange, validDate } from '../src/utils/todoSchedule'
import { normalizeTodoPatch } from '../server/validation/todo'

test('week is Monday through Sunday, including year boundaries', () => {
  assert.deepEqual(weekRange('2026-09-07'), { startDate: '2026-09-07', dueDate: '2026-09-13' })
  assert.deepEqual(weekRange('2026-09-13'), { startDate: '2026-09-07', dueDate: '2026-09-13' })
  assert.deepEqual(weekRange('2027-01-01'), { startDate: '2026-12-28', dueDate: '2027-01-03' })
})
test('today and custom ranges preserve inclusive dates', () => {
  assert.deepEqual(schedulePreset('today', '2026-09-07'), { mode: 'today', startDate: '2026-09-07', dueDate: '2026-09-07' })
  assert.deepEqual(schedulePatch({ mode: 'custom', startDate: '2026-09-09', dueDate: '2026-09-18' }), { startDate: '2026-09-09', dueDate: '2026-09-18', horizon: 'long' })
})
test('today uses planned range rather than creation date', () => {
  const task = { createdAt: '2026-08-01', horizon: 'long' as const, startDate: '2026-09-07', dueDate: '2026-09-13' }
  assert.ok(overlapsRange(task, '2026-09-07', '2026-09-07'))
  assert.ok(overlapsRange(task, '2026-09-13', '2026-09-13'))
  assert.equal(overlapsRange(task, '2026-09-14', '2026-09-14'), false)
  assert.equal(overlapsRange(task, '2026-09-06', '2026-09-06'), false)
  assert.ok(overlapsRange(task, '2026-09-01', '2026-09-08'))
})
test('legacy dates stay anchored to their original schedule', () => {
  assert.ok(overlapsRange({ createdAt: '2026-09-08', horizon: 'week' }, '2026-09-13', '2026-09-13'))
  assert.equal(overlapsRange({ createdAt: '2026-09-08', horizon: 'week' }, '2026-09-14', '2026-09-14'), false)
  assert.ok(overlapsRange({ createdAt: '2026-08-01', dueDate: '2026-09-07', horizon: 'today' }, '2026-09-07', '2026-09-07'))
})
test('reject impossible dates, inverted intervals, and incomplete custom forms', () => {
  assert.equal(validDate('2026-02-29'), false)
  assert.equal(validDate('2028-02-29'), true)
  assert.throws(() => validateRange('2026-09-09', '2026-09-08'))
  assert.throws(() => schedulePatch({ mode: 'custom', startDate: '', dueDate: '2026-09-08' }))
  assert.throws(() => normalizeTodoPatch({ startDate: '2026-02-30' }))
  assert.throws(() => normalizeTodoPatch({ title: 'test', startDate: '2026-09-09', dueDate: '2026-09-08' }, true))
})
