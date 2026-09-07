import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Todo, TodoStatus, TodoPriority, TodoDifficulty, TodoHorizon } from '@/types'
import { api, type TodoPatch, type TodoInput } from '@/api'
import { seedTodos } from '@/data/seed'

/** 短期 → 长期，用于分组与排序 */
export const horizonOrder: TodoHorizon[] = ['today', 'week', 'month', 'long']

export const horizonLabels: Record<TodoHorizon, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  long: '长期',
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])

  const byProject = computed(() => {
    const m = new Map<string, Todo[]>()
    todos.value.forEach(t => {
      const key = t.projectId ?? '__unassigned__'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(t)
    })
    return m
  })

  const roots = computed(() => todos.value.filter(t => !t.parentId))

  const byHorizon = computed(() => {
    const m = new Map<TodoHorizon, Todo[]>()
    horizonOrder.forEach(h => m.set(h, []))
    todos.value.forEach(t => m.get(t.horizon)?.push(t))
    return m
  })

  const children = computed(() => {
    const m = new Map<string, Todo[]>()
    todos.value.forEach(t => {
      if (!t.parentId) return
      if (!m.has(t.parentId)) m.set(t.parentId, [])
      m.get(t.parentId)!.push(t)
    })
    return m
  })

  const recentOpen = computed(() =>
    todos.value
      .filter(t => t.status !== 'done')
      .slice()
      .sort((a, b) => {
        const ap = priorityWeight(a.priority)
        const bp = priorityWeight(b.priority)
        if (ap !== bp) return bp - ap
        return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
      }),
  )

  function priorityWeight(p: TodoPriority): number {
    return p === 'high' ? 3 : p === 'medium' ? 2 : 1
  }

  async function load() {
    try {
      todos.value = await api.listTodos()
    } catch (e) {
      console.warn('[todos] 后端不可用，回退到 seed 数据', e)
      todos.value = seedTodos
    }
  }

  async function add(input: TodoInput) {
    const todo = await api.createTodo(input)
    todos.value.unshift(todo)
    return todo
  }

  async function update(id: string, patch: TodoPatch) {
    const updated = await api.updateTodo(id, patch)
    const i = todos.value.findIndex(x => x.id === id)
    if (i >= 0) todos.value[i] = updated
    return updated
  }

  async function remove(id: string) {
    await api.deleteTodo(id)
    todos.value = todos.value.filter(t => t.id !== id)
  }

  async function setStatus(id: string, status: TodoStatus) {
    await update(id, { status })
  }

  return {
    todos,
    roots,
    children,
    byProject,
    byHorizon,
    recentOpen,
    load,
    add,
    update,
    remove,
    setStatus,
  }
})

export const priorityLabels: Record<TodoPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const difficultyLabels: Record<TodoDifficulty, string> = {
  easy: '易',
  medium: '中',
  hard: '难',
}
