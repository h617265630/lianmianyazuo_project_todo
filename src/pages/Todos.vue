<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import type { Todo } from '@/types'
import SlideOver from '@/components/ui/SlideOver.vue'
import { api } from '@/api'

const projects = useProjectsStore()

// Load all todos from API
const allTodos = ref<Todo[]>([])

onMounted(async () => {
  try {
    const [open, done] = await Promise.all([api.listOpenTodos(), api.listDoneTodos()])
    allTodos.value = [...open, ...done]
  } catch (e) {
    console.warn('[todos] 加载失败', e)
  }
})

// Selected project: null = all
const selectedProjectId = ref<string | null>(null)

const filteredTodos = computed(() => {
  if (!selectedProjectId.value) return allTodos.value
  return allTodos.value.filter(t => t.projectId === selectedProjectId.value)
})

const kanbanTasks = computed(() => filteredTodos.value)

// Project with todo counts
const projectStats = computed(() => {
  const stats = new Map<string, { open: number; done: number }>()
  for (const t of allTodos.value) {
    if (!t.projectId) continue
    if (!stats.has(t.projectId)) stats.set(t.projectId, { open: 0, done: 0 })
    const s = stats.get(t.projectId)!
    if (t.status === 'done') s.done++; else s.open++
  }
  return stats
})

// Unassigned todos
const unassignedTodos = computed(() => allTodos.value.filter(t => !t.projectId))
const unassignedStats = computed(() => {
  const open = unassignedTodos.value.filter(t => t.status !== 'done').length
  const done = unassignedTodos.value.filter(t => t.status === 'done').length
  return { open, done }
})

// ── New todo form ──────────────────────────────────────────────────────────────
const showAdd = ref(false)
const newTodoTitle = ref('')
const newTodoProject = ref('')
const newTodoPriority = ref<'low' | 'medium' | 'high'>('medium')
const newTodoHorizon = ref<'today' | 'week' | 'month' | 'long'>('week')

async function submitNewTodo() {
  const title = newTodoTitle.value.trim()
  if (!title) return
  try {
    const created = await api.createPublicTodo({
      title,
      userId: 'u-n',
      priority: newTodoPriority.value,
      difficulty: 'medium',
      horizon: newTodoHorizon.value as any,
      projectId: newTodoProject.value || undefined,
    })
    allTodos.value.unshift(created)
    newTodoTitle.value = ''
    showAdd.value = false
  } catch (e) {
    console.warn('[todos] 创建失败', e)
  }
}

// ── Task update/delete ────────────────────────────────────────────────────────
function onTaskUpdate(updated: Todo) {
  const idx = allTodos.value.findIndex(x => x.id === updated.id)
  if (idx >= 0) {
    if (updated.status === 'done') {
      allTodos.value.splice(idx, 1)
    } else {
      allTodos.value[idx] = updated
    }
  }
}

async function onTaskDelete(deleted: Todo) {
  try {
    await api.deleteTodo(deleted.id)
    allTodos.value = allTodos.value.filter(x => x.id !== deleted.id)
  } catch (e) {
    console.warn('[todos] 删除失败', e)
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] overflow-hidden gap-0">

    <!-- 左侧项目列表 -->
    <aside class="w-56 shrink-0 overflow-y-auto p-6 space-y-1" style="border-right: 1px solid var(--color-line)">
      <div class="mb-6">
        <h2 class="text-lg font-medium mb-1">项目</h2>
        <p class="text-xs" style="color: var(--color-mute)">点击查看待办</p>
      </div>

      <!-- 全部 -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
        :class="selectedProjectId === null ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50'"
        @click="selectedProjectId = null"
      >
        <span class="flex items-center justify-between">
          <span>全部</span>
          <span class="text-xs tabular" style="color: var(--color-mute)">{{ allTodos.length }}</span>
        </span>
      </button>

      <!-- 未关联 -->
      <button
        class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
        :class="selectedProjectId === '__unassigned__' ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50'"
        @click="selectedProjectId = '__unassigned__'"
      >
        <span class="flex items-center justify-between">
          <span style="color: var(--color-mute)">未关联</span>
          <span class="text-xs tabular" style="color: var(--color-mute)">{{ unassignedStats.open + unassignedStats.done }}</span>
        </span>
      </button>

      <!-- 各项目 -->
      <button
        v-for="p in projects.projects"
        :key="p.id"
        class="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group"
        :class="selectedProjectId === p.id ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50'"
        @click="selectedProjectId = p.id"
      >
        <span class="flex items-center justify-between">
          <span class="truncate">{{ p.name }}</span>
          <span class="text-xs tabular shrink-0 ml-2" style="color: var(--color-mute)">
            {{ (projectStats.get(p.id)?.open ?? 0) + (projectStats.get(p.id)?.done ?? 0) }}
          </span>
        </span>
        <span
          v-if="projectStats.get(p.id)"
          class="block text-xs mt-0.5"
          style="color: var(--color-mute)"
        >
          <span style="color: var(--color-accent)">{{ projectStats.get(p.id)!.open }}</span>
          <span> 未完成 · </span>
          <span>{{ projectStats.get(p.id)!.done }}</span>
          <span> 已完成</span>
        </span>
      </button>
    </aside>

    <!-- 右侧看板 -->
    <main class="flex-1 overflow-y-auto p-8 space-y-6">
      <header class="flex items-baseline justify-between">
        <div>
          <h1 class="text-3xl font-medium" style="letter-spacing: -0.03em">
            {{
              selectedProjectId === null
                ? '全部待办'
                : selectedProjectId === '__unassigned__'
                  ? '未关联'
                  : projects.byId.get(selectedProjectId!)?.name ?? '待办'
            }}
          </h1>
          <p class="text-sm mt-1" style="color: var(--color-mute)">
            {{ filteredTodos.length }} 条待办
          </p>
        </div>
        <button class="btn-cta" @click="showAdd = true">+ 新建</button>
      </header>

      <KanbanBoard
        :tasks="kanbanTasks"
        :can-write="true"
        force-kanban
        @task-update="onTaskUpdate"
        @task-delete="onTaskDelete"
      />
    </main>

    <!-- 新建 SlideOver -->
    <SlideOver :open="showAdd" title="新建待办" @close="showAdd = false">
      <form @submit.prevent="submitNewTodo" class="space-y-6">
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">标题</label>
          <input v-model="newTodoTitle" required class="input-line mt-2 text-lg" placeholder="一句话写清楚" autofocus />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">关联项目</label>
          <select v-model="newTodoProject" class="input-line mt-2">
            <option value="">未关联</option>
            <option v-for="p in projects.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">优先级</label>
          <div class="flex gap-3 mt-2">
            <button
              v-for="p in [['low','低'],['medium','中'],['high','高']]"
              :key="p[0]"
              type="button"
              class="chip"
              :class="{ 'is-active': newTodoPriority === p[0] }"
              @click="newTodoPriority = p[0] as any"
            >
              {{ p[1] }}
            </button>
          </div>
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">时间跨度</label>
          <div class="flex gap-3 mt-2">
            <button
              v-for="h in [['today','今日'],['week','本周'],['month','本月'],['long','长期']]"
              :key="h[0]"
              type="button"
              class="chip"
              :class="{ 'is-active': newTodoHorizon === h[0] }"
              @click="newTodoHorizon = h[0] as any"
            >
              {{ h[1] }}
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-link" @click="showAdd = false">取消</button>
          <button type="submit" class="btn-cta" :disabled="!newTodoTitle.trim()">保存</button>
        </div>
      </form>
    </SlideOver>
  </div>
</template>
