<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTodosStore } from '@/stores/todos'
import { useResourcesStore } from '@/stores/resources'
import { useResearchStore } from '@/stores/research'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import TodoScheduleFields from '@/components/TodoScheduleFields.vue'
import { localDate, weekRange, schedulePreset, schedulePatch, overlapsRange } from '@/utils/todoSchedule'
import TodoBlock from '@/components/todo-block.vue'
import { api } from '@/api'
import type { Todo } from '@/types'

const projects = useProjectsStore()
const todos = useTodosStore()
const resources = useResourcesStore()
const research = useResearchStore()

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
  try {
    await projects.load()
  } catch (e) {
    console.warn('[home] 无法获取projects', e)
  }
})

const today = new Date()
// 使用本地时区的"今天"（用户视角），避免跨时区错位
const todayStr = ref(localDate())
const dateTimer = setInterval(() => { todayStr.value = localDate() }, 30_000)
onUnmounted(() => clearInterval(dateTimer))
const currentWeek = computed(() => weekRange(todayStr.value))
const filterStart = ref(currentWeek.value.startDate)
const filterEnd = ref(currentWeek.value.dueDate)

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

// 今日和本周按实际安排的时间段筛选（含起止日期）
const todayTodos = computed(() => {
  return allOpenTodos.value.filter(t => overlapsRange(t, todayStr.value, todayStr.value))
})

// 本周待办
const weekTodos = computed(() => {
  return allOpenTodos.value.filter(t => overlapsRange(t, currentWeek.value.startDate, currentWeek.value.dueDate))
})

// Tab: 今日/本周/历史
const todoTab = ref<'today' | 'week' | 'range' | 'history'>('today')
// 左侧历史选中的日期（点哪条就在右侧显示该日的）
const selectedHistoryDate = ref<string | null>(null)
function selectHistoryDate(d: string) {
  selectedHistoryDate.value = selectedHistoryDate.value === d ? null : d
  if (selectedHistoryDate.value) todoTab.value = 'history'
}
function clearHistoryDate() {
  selectedHistoryDate.value = null
}
const tabTodos = computed(() => {
  if (todoTab.value === 'today') return todayTodos.value
  if (todoTab.value === 'week') return weekTodos.value
  if (todoTab.value === 'range') return allOpenTodos.value.filter(t => overlapsRange(t, filterStart.value, filterEnd.value))
  // history：按选中日期过滤；没选就显示全部已完成
  if (selectedHistoryDate.value) {
    return allDoneTodos.value.filter(t => t.createdAt === selectedHistoryDate.value)
  }
  return allDoneTodos.value
})

// ==== 新增 todo ====
const showAdd = ref(false)
const newSchedule = ref(schedulePreset('today'))
watch(showAdd, open => {
  if (open) newSchedule.value = todoTab.value === 'range' ? { mode: 'custom', startDate: filterStart.value, dueDate: filterEnd.value } : schedulePreset(todoTab.value === 'week' ? 'week' : 'today')
})
const createError = ref('')
const isCreating = ref(false)
const newTodoUser = ref<'u-n' | 'u-v'>('u-n')
const newTodoTitle = ref('')

async function addTodo() {
  const title = newTodoTitle.value.trim()
  if (!title || isCreating.value) return
  isCreating.value = true
  createError.value = ''
  try {
    const created = await api.createPublicTodo({
      title,
      userId: newTodoUser.value,
      priority: 'medium',
      difficulty: 'medium',
      ...schedulePatch(newSchedule.value),
    })
    allOpenTodos.value.unshift(created)
    await todos.load()
    newTodoTitle.value = ''
    showAdd.value = false
  } catch (e) {
    createError.value = e instanceof Error ? e.message : '添加失败'
  } finally {
    isCreating.value = false
  }
}

function onTaskUpdate(updated: Todo) {
  allOpenTodos.value = allOpenTodos.value.filter(x => x.id !== updated.id)
  allDoneTodos.value = allDoneTodos.value.filter(x => x.id !== updated.id)
  if (updated.status === 'done') allDoneTodos.value.unshift(updated)
  else allOpenTodos.value.unshift(updated)
}


function onTaskDelete(deleted: Todo) {
  allOpenTodos.value = allOpenTodos.value.filter(x => x.id !== deleted.id)
  allDoneTodos.value = allDoneTodos.value.filter(x => x.id !== deleted.id)
}

</script>

<template>
  <div class="home-workspace space-y-8">
    <header class="home-heading flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="eyebrow">我的工作台 <span class="mx-2 opacity-40">/</span> {{ todayLabel }}</p>
        <h1 class="mt-3 text-3xl sm:text-4xl font-medium">{{ greeting }}，让想法向前一步。</h1>
        <p class="mt-3 text-sm" style="color: var(--color-mute)">从一个项目开始，把待办、资料与思考连在一起。</p>
      </div>
      <RouterLink to="/projects" class="btn-cta">进入项目 <span aria-hidden="true">↗</span></RouterLink>
    </header>

    <section class="overview-strip" aria-label="工作台概况">
      <RouterLink to="/projects"><span class="metric-caption">进行中的项目</span><strong>{{ projects.stats.inProgress }}</strong><span class="metric-hint">持续推进 <span>↗</span></span></RouterLink>
      <RouterLink to="/todos"><span class="metric-caption">待完成的事项</span><strong>{{ allOpenTodos.length }}</strong><span class="metric-hint">一步一步来 <span>↗</span></span></RouterLink>
      <RouterLink to="/resources"><span class="metric-caption">收藏的资料</span><strong>{{ resources.items.length }}</strong><span class="metric-hint">积累下一次灵感 <span>↗</span></span></RouterLink>
      <RouterLink to="/research"><span class="metric-caption">沉淀的思考</span><strong>{{ research.items.length }}</strong><span class="metric-hint">让经验留下来 <span>↗</span></span></RouterLink>
    </section>

    <section>
      <header class="section-heading"><div><p class="eyebrow">PROJECTS</p><h2>正在推进的项目</h2></div><RouterLink to="/projects" class="btn-link text-xs">全部项目 ↗</RouterLink></header>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <RouterLink v-for="(p, i) in featuredProjects" :key="p.id" :to="`/projects/${p.id}`" class="project-preview glass group p-5">
          <div class="flex items-center justify-between mb-5"><span class="project-number">{{ String(i + 1).padStart(2, '0') }}</span><StatusBadge :status="p.status" /></div>
          <h3 class="text-lg mb-2">{{ p.name }}</h3>
          <p class="text-xs leading-6 line-clamp-2 min-h-12 mb-5" style="color: var(--color-mute)">{{ p.tagline }}</p>
          <div class="flex justify-between text-xs mb-2" style="color: var(--color-mute)"><span>项目进度</span><span class="tabular">{{ p.progress }}%</span></div>
          <ProgressBar :value="p.progress" :show-label="false" />
        </RouterLink>
        <RouterLink v-if="!featuredProjects.length" to="/projects" class="empty-panel col-span-full">还没有进行中的项目，创建第一个项目 ↗</RouterLink>
      </div>
    </section>

    <section>
      <header class="section-heading"><div><p class="eyebrow">NEXT STEPS</p><h2>把计划变成进展</h2></div><RouterLink to="/todos" class="btn-link text-xs">全部待办 ↗</RouterLink></header>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside class="history-panel lg:col-span-3 glass p-5">
          <div class="flex justify-between items-center mb-4"><h3 class="text-sm">历史待办</h3><span class="eyebrow">{{ allDoneTodos.length }} 已完成</span></div>
          <ul class="space-y-1 max-h-80 overflow-auto">
            <li v-for="g in historyByDate" :key="g.date">
              <button class="history-date" :class="{ selected: selectedHistoryDate === g.date }" @click="selectHistoryDate(g.date)"><span>{{ g.date }}</span><span class="history-count">{{ g.count }}</span></button>
            </li>
            <li v-if="!historyByDate.length" class="py-6 text-xs text-center" style="color: var(--color-mute)">完成的待办会留在这里</li>
          </ul>
          <p class="text-xs mt-5 pt-4 border-t leading-6" style="color: var(--color-mute); border-color: var(--color-line)">回看已经完成的事，<br>也看见每一步的积累。</p>
        </aside>
        <div class="lg:col-span-9 min-w-0 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="workspace-tabs" role="group" aria-label="待办时间范围">
              <button v-for="tab in [['today','今日待办'],['week','本周待办'],['range','时间段'],['history','历史待办']] as const" :key="tab[0]" :aria-pressed="todoTab === tab[0]" :class="{ active: todoTab === tab[0] }" @click="todoTab = tab[0]">{{ tab[1] }}</button>
            </div>
            <button v-if="todoTab !== 'history'" class="btn-cta text-xs" @click="showAdd = !showAdd">+ 添加待办</button>
            <button v-else-if="selectedHistoryDate" class="btn-link text-xs" @click="clearHistoryDate">{{ selectedHistoryDate }} · 查看全部</button>
          </div>
          <div v-if="todoTab === 'range'" class="glass p-4 flex flex-wrap gap-3 items-end">
            <label class="text-xs">筛选开始日期<input v-model="filterStart" type="date" :max="filterEnd" class="input-line" /></label>
            <label class="text-xs">筛选结束日期<input v-model="filterEnd" type="date" :min="filterStart" class="input-line" /></label>
            <p v-if="!filterStart || !filterEnd || filterStart > filterEnd" role="alert" class="text-xs text-red-600">请选择有效的起止日期</p>
          </div>
          <form v-if="showAdd" class="glass p-4 space-y-3" @submit.prevent="addTodo">
            <p v-if="createError" role="alert" class="text-xs text-red-600">{{ createError }}</p>
            <input v-model="newTodoTitle" placeholder="下一步要做什么？" aria-label="待办标题" class="input-line w-full" required autofocus />
            <TodoScheduleFields v-model="newSchedule" :disabled="isCreating" />
            <div class="flex flex-wrap items-center gap-3"><label class="text-xs" for="todo-owner">分配给</label><select id="todo-owner" v-model="newTodoUser" class="input-line w-auto text-xs"><option value="u-n">n</option><option value="u-v">v</option></select><button type="submit" :disabled="isCreating" class="btn-cta text-xs ml-auto">添加</button><button type="button" class="btn-link text-xs" @click="showAdd = false">取消</button></div>
          </form>
          <KanbanBoard v-if="todoTab !== 'history'" :tasks="tabTodos" :can-write="true" :is-home="true" force-kanban @task-update="onTaskUpdate" @task-delete="onTaskDelete" />
          <div v-else class="grid sm:grid-cols-2 gap-3">
            <TodoBlock v-for="task in tabTodos" :key="task.id" :task="task" :can-write="true" @update="onTaskUpdate" @delete="onTaskDelete" />
            <p v-if="!tabTodos.length" class="empty-panel col-span-full">暂无历史记录</p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid md:grid-cols-2 gap-5">
      <article class="glass p-5 sm:p-6">
        <header class="section-heading"><div><p class="eyebrow">RESEARCH</p><h2>最近的思考</h2></div><RouterLink to="/research" class="btn-link text-xs">查看全部 ↗</RouterLink></header>
        <RouterLink v-for="n in recentResearch" :key="n.id" to="/research" class="resource-preview"><span class="resource-icon">研</span><div class="min-w-0"><h3 class="text-sm truncate">{{ n.title }}</h3><p class="text-xs mt-1 line-clamp-1" style="color: var(--color-mute)">{{ n.teaser }}</p></div><span class="ml-auto text-xs opacity-50">↗</span></RouterLink>
        <p v-if="!recentResearch.length" class="py-5 text-sm" style="color: var(--color-mute)">记录一个想法，让它成为下一次行动的起点。</p>
      </article>
      <article class="glass p-5 sm:p-6">
        <header class="section-heading"><div><p class="eyebrow">LIBRARY</p><h2>最近收藏</h2></div><RouterLink to="/resources" class="btn-link text-xs">资料库 ↗</RouterLink></header>
        <div v-for="r in resources.items.slice(0, 3)" :key="r.id" class="resource-preview"><span class="resource-icon">藏</span><div class="min-w-0"><a v-if="r.url" :href="r.url" target="_blank" rel="noopener noreferrer" class="text-sm truncate block">{{ r.title }}</a><p v-else class="text-sm truncate">{{ r.title }}</p><p class="text-xs mt-1" style="color: var(--color-mute)">{{ r.kind }}</p></div><span class="ml-auto text-xs opacity-50">↗</span></div>
        <p v-if="!resources.items.length" class="py-5 text-sm" style="color: var(--color-mute)">把有用的链接和资料收藏到这里。</p>
      </article>
    </section>
  </div>
</template>
