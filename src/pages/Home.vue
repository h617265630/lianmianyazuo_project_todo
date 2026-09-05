<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTodosStore, difficultyLabels } from '@/stores/todos'
import { useResourcesStore } from '@/stores/resources'
import { useResearchStore } from '@/stores/research'
import { useKanbanStore } from '@/stores/kanban'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import { relativeDays } from '@/utils/format'
import { api } from '@/api'
import type { Todo, TodoStatus } from '@/types'

const projects = useProjectsStore()
const todos = useTodosStore()
const resources = useResourcesStore()
const research = useResearchStore()
const kanban = useKanbanStore()

const allOpenTodos = ref<Todo[]>([])
const allDoneTodos = ref<Todo[]>([])

// 历史待办：按日期分组（取 createdAt 最近的 30 天）
const historyByDate = computed(() => {
  const all = allDoneTodos.value
  const m = new Map<string, { date: string; count: number; nCount: number; vCount: number }>()
  all.forEach(t => {
    const d = t.createdAt
    if (!m.has(d)) m.set(d, { date: d, count: 0, nCount: 0, vCount: 0 })
    const entry = m.get(d)!
    entry.count++
    if (t.userId === 'u-n') entry.nCount++
    if (t.userId === 'u-v') entry.vCount++
  })
  return Array.from(m.values()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
})

// 首页虚拟看板：todos 加载完后初始化 buckets
onMounted(async () => {
  try {
    allOpenTodos.value = await api.listOpenTodos()
    allDoneTodos.value = await api.listDoneTodos()
  } catch (e) {
    console.warn('[home] 无法获取todos', e)
  }
  kanban.loadBucketsHome(allOpenKanbanTodos.value)
})

// todos 变化时刷新看板
watch(allOpenTodos, () => {
  kanban.loadBucketsHome(allOpenKanbanTodos.value)
})

const today = new Date()
const todayStr = '2026-09-06'

const greeting = computed(() => {
  const h = today.getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早安'
  if (h < 14) return '正午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayLabel = today.toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

const featuredProjects = computed(() =>
  projects.activeProjects
    .slice()
    .sort((a, b) => {
      const order = { 'in-progress': 0, blocked: 1, planning: 2, completed: 3, archived: 4 }
      return order[a.status] - order[b.status] || b.progress - a.progress
    }),
)

const recentResearch = computed(() =>
  research.items
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3),
)

// 以「dueDate」为单位的开放 todos，按日期分组显示
const dailyTodos = computed(() => {
  const map = new Map<string, Todo[]>()
  const today = todayStr
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  for (const t of allOpenTodos.value) {
    if (!t.dueDate) continue
    const label = t.dueDate === today ? '今日' : t.dueDate === tomorrow ? '明日' : t.dueDate === yesterday ? '昨日' : t.dueDate
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(t)
  }

  // 按日期 key 自然排序
  const order = ['昨日', '今日', '明日']
  const keys = Array.from(map.keys()).sort((a, b) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })
  return keys.map(k => ({ date: k, todos: map.get(k)! }))
})

// 今日 todos —— 以手动选择的时间跨度为准，而非截止日期
const todayTodos = computed(() => {
  return allOpenTodos.value.filter(t => t.horizon === 'today')
})

// 看板显示所有未完成的 todo（不限 horizon，确保有内容）
const allOpenKanbanTodos = computed(() => {
  return allOpenTodos.value
})

// 今日 todos 按用户分成两列：n 的待办 / v 的待办
const nTodayTodos = computed(() =>
  todayTodos.value.filter(t => t.userId === 'u-n'),
)
const vTodayTodos = computed(() =>
  todayTodos.value.filter(t => t.userId === 'u-v'),
)

// ==== 新增 todo ====
const showAdd = ref(false)
const newTodoUser = ref<'u-n' | 'u-v'>('u-n')
const newTodoTitle = ref('')

async function addTodo() {
  const title = newTodoTitle.value.trim()
  if (!title) return
  try {
    const created = await api.createPublicTodo({
      title,
      userId: newTodoUser.value,
      priority: 'medium',
      difficulty: 'medium',
      horizon: 'today',
      dueDate: todayStr,
    })
    allOpenTodos.value.unshift(created)
    newTodoTitle.value = ''
    showAdd.value = false
  } catch (e) {
    console.warn('[home] 添加todo失败', e)
  }
}

async function cycleStatus(t: Todo) {
  const order: TodoStatus[] = ['todo', 'doing', 'done']
  const i = order.indexOf(t.status)
  const next = order[(i + 1) % order.length]

  // 如果是标记为完成，需要确认
  if (next === 'done') {
    if (!confirm(`确认完成「${t.title}」？`)) return
  }

  try {
    await api.updateTodo(t.id, { status: next })
    const idx = allOpenTodos.value.findIndex(x => x.id === t.id)
    if (idx >= 0) {
      if (next === 'done') {
        allOpenTodos.value.splice(idx, 1)
        allDoneTodos.value.unshift({ ...t, status: 'done' })
      } else {
        allOpenTodos.value[idx] = { ...t, status: next }
      }
    }
  } catch (e) {
    console.warn('[home] 更新状态失败', e)
  }
}

async function updateTitle(t: Todo, newTitle: string) {
  if (!newTitle.trim() || newTitle === t.title) return
  try {
    await api.updateTodo(t.id, { title: newTitle.trim() })
    const idx = allOpenTodos.value.findIndex(x => x.id === t.id)
    if (idx >= 0) allOpenTodos.value[idx] = { ...t, title: newTitle.trim() }
  } catch (e) {
    console.warn('[home] 更新标题失败', e)
  }
}

async function deleteTodo(t: Todo) {
  try {
    await api.deleteTodo(t.id)
    allOpenTodos.value = allOpenTodos.value.filter(x => x.id !== t.id)
    allDoneTodos.value = allDoneTodos.value.filter(x => x.id !== t.id)
  } catch (e) {
    console.warn('[home] 删除失败', e)
  }
}

function onTaskUpdate(updated: Todo) {
  const idx = allOpenTodos.value.findIndex(x => x.id === updated.id)
  if (idx >= 0) {
    if (updated.status === 'done') {
      allOpenTodos.value.splice(idx, 1)
      allDoneTodos.value.unshift(updated)
    } else {
      allOpenTodos.value[idx] = updated
    }
  }
}

async function onTaskDelete(deleted: Todo) {
  try {
    await api.deleteTodo(deleted.id)
    allOpenTodos.value = allOpenTodos.value.filter(x => x.id !== deleted.id)
    allDoneTodos.value = allDoneTodos.value.filter(x => x.id !== deleted.id)
  } catch (e) {
    console.warn('[home] 删除失败', e)
  }
}

async function restoreTodo(t: Todo) {
  try {
    await api.updateTodo(t.id, { status: 'todo' })
    allDoneTodos.value = allDoneTodos.value.filter(x => x.id !== t.id)
    allOpenTodos.value.unshift({ ...t, status: 'todo' })
  } catch (e) {
    console.warn('[home] 恢复失败', e)
  }
}

function priorityMark(p: string) {
  return p === 'high' ? '!!!' : p === 'medium' ? '!!' : '!'
}
function priorityColor(p: string) {
  return p === 'high' ? 'var(--color-warn)' : p === 'medium' ? 'var(--color-ink)' : 'var(--color-mute)'
}
</script>

<template>
  <div class="space-y-6">
    <!-- ============ 状态概览 ============ -->
    <section class="rise">
      <header class="flex items-baseline justify-between mb-6">
        <div>
          <h2 class="text-3xl md:text-4xl font-medium" style="letter-spacing: -0.025em">{{ greeting }}</h2>
          <p class="text-sm mt-2" style="color: var(--color-mute)">{{ todayLabel }}</p>
        </div>
      </header>

      <div class="frame p-8">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-accent)">{{ projects.stats.inProgress }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">进行</p>
          </div>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-mute)">{{ projects.stats.planning }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">规划</p>
          </div>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-warn)">{{ projects.stats.blocked }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">受阻</p>
          </div>
          <RouterLink to="/todos" class="block group" title="查看全部待办">
            <p class="text-4xl tabular font-medium" style="color: var(--color-accent); transition: color 0.15s">{{ allOpenTodos.length }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">待办</p>
          </RouterLink>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-ink)">{{ resources.items.length }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">资料</p>
          </div>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-ink)">{{ research.stats.total }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">研究</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 项目快捷入口 ============ -->
    <section class="rise rise-1">
      <header class="flex items-baseline justify-between mb-6">
        <div>
          <h2 class="text-3xl md:text-4xl font-medium" style="letter-spacing: -0.025em">
            当前在做的项目
          </h2>
          <p class="text-sm mt-2" style="color: var(--color-mute)">
            点击直达 — 进度、瓶颈、相关资料一站查阅
          </p>
        </div>
        <RouterLink to="/projects" class="btn-link text-sm">查看全部 →</RouterLink>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="(p, i) in featuredProjects"
          :key="p.id"
          :to="`/projects/${p.id}`"
          class="glass group p-6 transition duration-200 hover:border-accent hover:-translate-y-0.5"
        >
          <div class="flex items-start justify-between mb-6">
            <span
              class="text-xs tracking-widest uppercase tabular"
              style="color: var(--color-mute)"
            >{{ String(i + 1).padStart(2, '0') }}</span>
            <StatusBadge :status="p.status" />
          </div>
          <h3
            class="text-xl md:text-2xl font-medium leading-tight mb-2"
            style="letter-spacing: -0.015em"
          >
            {{ p.name }}
          </h3>
          <p class="text-xs mb-6 leading-5" style="color: var(--color-mute); min-height: 2.5rem">
            {{ p.tagline }}
          </p>
          <ProgressBar :value="p.progress" />
          <p
            class="text-xs mt-4 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity"
            style="color: var(--color-accent)"
          >进入项目 →</p>
        </RouterLink>
      </div>
    </section>

    <!-- ============ Todo 区域：左侧历史 + 右侧今日看板 ============ -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 rise rise-2">
      <!-- 左侧：历史待办日期列表 -->
      <div class="lg:col-span-3 glass p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-medium">历史待办</h2>
          <RouterLink to="/todos" class="btn-link text-sm">全部 →</RouterLink>
        </div>

        <ul class="space-y-1">
          <li
            v-for="g in historyByDate"
            :key="g.date"
          >
            <RouterLink
              :to="`/todos/by-date/${g.date}`"
              class="flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors hover:bg-stone-100 group"
            >
              <span class="text-sm flex-1">{{ g.date }}</span>
              <span v-if="g.nCount" class="text-xs px-1.5 py-0.5 rounded" style="background: var(--color-accent); color: var(--color-bg)">{{ g.nCount }}</span>
              <span v-if="g.vCount" class="text-xs px-1.5 py-0.5 rounded" style="background: var(--color-ink); color: var(--color-bg)">{{ g.vCount }}</span>
              <span class="text-xs tabular" style="color: var(--color-mute)">{{ g.count }}</span>
            </RouterLink>
          </li>
          <li v-if="historyByDate.length === 0" class="py-8 text-sm text-center" style="color: var(--color-mute)">
            暂无历史记录
          </li>
        </ul>
      </div>

      <!-- 右侧：今日看板（占满右侧） -->
      <div class="lg:col-span-9 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-medium">今日待办 · {{ todayStr }}</h2>
          <button class="btn-cta text-sm" @click="showAdd = true">+ 添加</button>
        </div>

        <!-- 添加表单 -->
        <div v-if="showAdd" class="glass p-6 space-y-4">
          <input
            v-model="newTodoTitle"
            @keyup.enter="addTodo"
            placeholder="输入新待办，按 Enter 添加"
            class="input-line w-full"
            autofocus
          />
          <div class="flex items-center gap-3">
            <span class="text-xs" style="color: var(--color-mute)">分配给：</span>
            <button
              @click="newTodoUser = 'u-n'"
              class="text-xs px-3 py-1 rounded transition-colors"
              :class="newTodoUser === 'u-n' ? 'ring-1 ring-accent' : ''"
              :style="newTodoUser === 'u-n' ? 'background: var(--color-accent); color: var(--color-bg)' : 'background: var(--color-surface); color: var(--color-mute)'"
            >n</button>
            <button
              @click="newTodoUser = 'u-v'"
              class="text-xs px-3 py-1 rounded transition-colors"
              :class="newTodoUser === 'u-v' ? 'ring-1 ring-accent' : ''"
              :style="newTodoUser === 'u-v' ? 'background: var(--color-ink); color: var(--color-bg)' : 'background: var(--color-surface); color: var(--color-mute)'"
            >v</button>
            <button @click="addTodo" class="btn-cta text-sm ml-auto">添加</button>
            <button @click="showAdd = false; newTodoTitle = ''" class="btn-link text-sm">取消</button>
          </div>
        </div>

        <!-- 今日看板 -->
        <KanbanBoard :tasks="allOpenKanbanTodos" :can-write="true" force-kanban @task-update="onTaskUpdate" @task-delete="onTaskDelete" />
      </div>
    </section>

    <!-- ============ 三栏：todo / 研究 / 资料 ============ -->
    <section class="grid grid-cols-1 md:grid-cols-12 gap-6 rise rise-3">
      <!-- 研究 -->
      <div class="md:col-span-6 glass p-8">
        <h2 class="text-2xl font-medium mb-6">沉淀的思考</h2>
        <ul class="space-y-6">
          <li v-for="n in recentResearch" :key="n.id">
            <RouterLink to="/research" class="block group">
              <p class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">{{ n.stage }}</p>
              <h3 class="text-lg font-medium mt-1.5 leading-snug" style="letter-spacing: -0.01em">
                {{ n.title }}
              </h3>
              <p class="text-sm mt-1.5 line-clamp-2 leading-6" style="color: var(--color-ink-soft)">
                {{ n.teaser }}
              </p>
            </RouterLink>
          </li>
          <li v-if="recentResearch.length === 0" class="text-sm" style="color: var(--color-mute)">
            还没有研究 — 写下第一行。
          </li>
        </ul>
        <RouterLink to="/research" class="btn-link text-sm mt-5 inline-block">查看全部研究 →</RouterLink>
      </div>

      <!-- 资料 -->
      <div class="md:col-span-6 glass p-8">
        <h2 class="text-2xl font-medium mb-6">最近收藏</h2>
        <ul class="space-y-5">
          <li v-for="r in resources.items.slice(0, 4)" :key="r.id" class="space-y-1">
            <p class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">
              {{ r.kind }}
            </p>
            <a
              v-if="r.url"
              :href="r.url"
              target="_blank"
              class="text-sm transition-opacity hover:opacity-60 block leading-snug"
            >{{ r.title }} →</a>
            <p v-else class="text-sm leading-snug">{{ r.title }}</p>
          </li>
        </ul>
        <RouterLink to="/resources" class="btn-link text-sm mt-5 inline-block">查看全部资料 →</RouterLink>
      </div>
    </section>

    <!-- ============ 引言 ============ -->
    <section class="glass p-10 md:p-14 text-center rise rise-4">
      <p class="text-2xl md:text-3xl font-medium leading-tight" style="letter-spacing: -0.02em">
        每一颗安静的种子，<br />
        都比一座喧哗的花园更值得被照看。
      </p>
      <p class="text-xs tracking-widest uppercase mt-5" style="color: var(--color-mute)">
        —— 工作台卷首
      </p>
    </section>
  </div>
</template>
