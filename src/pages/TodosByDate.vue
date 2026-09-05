<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '@/api'
import type { Todo, TodoStatus } from '@/types'

const route = useRoute()
const date = computed(() => route.params.date as string)

// 显示格式
const dateLabel = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (date.value === today) return `今日 · ${date.value}`
  if (date.value === yesterday) return `昨日 · ${date.value}`
  return date.value
})

// 所有 todos（按日期过滤）
const allTodos = ref<Todo[]>([])
const doneTodos = ref<Todo[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [open, done] = await Promise.all([api.listOpenTodos(), api.listDoneTodos()])
    allTodos.value = open
    doneTodos.value = done
  } catch (e) {
    console.warn('[todos-by-date] 获取失败', e)
  } finally {
    loading.value = false
  }
})

const dateTodos = computed(() =>
  [...allTodos.value, ...doneTodos.value].filter(t => t.dueDate === date.value),
)

const stats = computed(() => {
  const total = dateTodos.value.length
  const done = dateTodos.value.filter(t => t.status === 'done').length
  const doing = dateTodos.value.filter(t => t.status === 'doing').length
  const todo = dateTodos.value.filter(t => t.status === 'todo').length
  return { total, done, doing, todo }
})

const byProject = computed(() => {
  const m = new Map<string, Todo[]>()
  dateTodos.value.forEach(t => {
    const key = t.projectId ?? '__no-project__'
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(t)
  })
  return m
})

async function cycleStatus(t: Todo) {
  const order: TodoStatus[] = ['todo', 'doing', 'done']
  const i = order.indexOf(t.status)
  const next = order[(i + 1) % order.length]
  try {
    await api.updateTodo(t.id, { status: next })
    const idx = dateTodos.value.findIndex(x => x.id === t.id)
    if (idx >= 0) {
      const updated = { ...t, status: next }
      if (next === 'done') {
        allTodos.value = allTodos.value.filter(x => x.id !== t.id)
        doneTodos.value.unshift(updated)
      } else {
        allTodos.value = allTodos.value.map(x => x.id === t.id ? updated : x)
      }
    }
  } catch (e) {
    console.warn('[todos-by-date] 更新失败', e)
  }
}

const priorityMark = (p: string) => p === 'high' ? '!!!' : p === 'medium' ? '!!' : '!'
const priorityColor = (p: string) =>
  p === 'high' ? 'var(--color-warn)' : p === 'medium' ? 'var(--color-ink)' : 'var(--color-mute)'

const userLabel = (uid?: string) => uid === 'u-n' ? 'n' : uid === 'u-v' ? 'v' : ''
</script>

<template>
  <div class="space-y-10">
    <!-- header -->
    <div class="flex items-baseline gap-4">
      <RouterLink to="/" class="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-60" style="color: var(--color-mute)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="8,2 4,6 8,10"/>
        </svg>
        首页
      </RouterLink>
      <h1 class="text-4xl md:text-5xl font-medium" style="letter-spacing: -0.03em">
        {{ dateLabel }}
      </h1>
    </div>

    <!-- stats -->
    <div class="glass p-6 flex items-center gap-8 text-sm">
      <div>
        <span class="text-3xl tabular font-medium" style="color: var(--color-ink)">{{ stats.total }}</span>
        <span class="text-xs tracking-widest uppercase ml-2" style="color: var(--color-mute)">总计</span>
      </div>
      <div>
        <span class="text-2xl tabular font-medium" style="color: var(--color-accent)">{{ stats.todo }}</span>
        <span class="text-xs tracking-widest uppercase ml-1.5" style="color: var(--color-mute)">待办</span>
      </div>
      <div>
        <span class="text-2xl tabular font-medium" style="color: var(--color-warn)">{{ stats.doing }}</span>
        <span class="text-xs tracking-widest uppercase ml-1.5" style="color: var(--color-mute)">进行中</span>
      </div>
      <div>
        <span class="text-2xl tabular font-medium" style="color: var(--color-mute)">{{ stats.done }}</span>
        <span class="text-xs tracking-widest uppercase ml-1.5" style="color: var(--color-mute)">已完成</span>
      </div>
    </div>

    <!-- loading -->
    <div v-if="loading" class="py-16 text-center" style="color: var(--color-mute)">
      加载中…
    </div>

    <!-- 按项目分组 -->
    <div v-else-if="dateTodos.length > 0" class="space-y-8">
      <div
        v-for="[projectId, ptodos] in byProject"
        :key="projectId"
        class="glass p-8"
      >
        <div class="flex items-baseline justify-between mb-5">
          <h2 class="text-xl font-medium">
            {{ projectId === '__no-project__' ? '无关联项目' : projectId }}
          </h2>
          <span class="text-xs tabular" style="color: var(--color-mute)">
            {{ ptodos.filter(t => t.status === 'done').length }} / {{ ptodos.length }} 完成
          </span>
        </div>

        <ul class="space-y-2">
          <li
            v-for="t in ptodos"
            :key="t.id"
            class="flex items-center gap-3 py-2 group"
          >
            <button
              @click="cycleStatus(t)"
              class="shrink-0 text-sm hover:opacity-60 transition-opacity"
              :style="{ color: priorityColor(t.priority) }"
            >
              <span class="font-mono">{{ priorityMark(t.priority) }}</span>
            </button>
            <span
              class="flex-1 text-sm truncate"
              :style="t.status === 'done' ? 'text-decoration: line-through; color: var(--color-mute)' : ''"
            >
              {{ t.title }}
            </span>
            <span v-if="userLabel(t.userId)" class="text-xs px-1.5 py-0.5 rounded shrink-0" :style="{ background: t.userId === 'u-n' ? 'var(--color-accent)' : 'var(--color-ink)', color: 'var(--color-bg)' }">
              {{ userLabel(t.userId) }}
            </span>
            <span
              v-if="t.status === 'doing'"
              class="text-xs px-1.5 py-0.5 rounded shrink-0"
              style="background: rgba(234,179,8,0.15); color: var(--color-warn)"
            >进行中</span>
            <span
              v-if="t.status === 'done'"
              class="text-xs px-1.5 py-0.5 rounded shrink-0"
              style="background: rgba(34,197,94,0.15); color: #22c55e"
            >完成</span>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="py-20 text-center" style="color: var(--color-mute)">
      这一天没有记录任何待办。
    </div>
  </div>
</template>
