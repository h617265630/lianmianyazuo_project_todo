<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTodosStore } from '@/stores/todos'
import { useResourcesStore, kindLabels } from '@/stores/resources'
import { useResearchStore } from '@/stores/research'
import { useInsightsStore, insightKindLabels } from '@/stores/insights'
import { useKanbanStore } from '@/stores/kanban'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import type { ProjectStatus, ProjectPhase, InsightKind, TodoPriority, TodoDifficulty, ResourceKind } from '@/types'
import { copyText, formatDate, relativeDays } from '@/utils/format'

const route = useRoute()
const id = computed(() => route.params.id as string)

const projects = useProjectsStore()
const todos = useTodosStore()
const resources = useResourcesStore()
const research = useResearchStore()
const insights = useInsightsStore()
const kanban = useKanbanStore()

// Load project views when project changes
import { watch } from 'vue'
watch(id, (pid) => {
  if (pid) kanban.loadViews(pid)
}, { immediate: true })

const project = computed(() => projects.byId.get(id.value))
const relatedTodos = computed(() => todos.byProject.get(id.value) ?? [])
const relatedResources = computed(() => resources.byProject.get(id.value) ?? [])
const relatedResearch = computed(() => research.byProject.get(id.value) ?? [])
const relatedInsights = computed(() => insights.byProject.get(id.value) ?? [])

const checkinNote = ref('')
const showPath = ref(false)

const phaseLabel: Record<ProjectPhase, string> = { started: '已开始', exploring: '准备/探视' }

const newObjective = ref('')
function addObjective() {
  if (!newObjective.value.trim() || !project.value) return
  projects.addObjective(project.value.id, newObjective.value.trim())
  newObjective.value = ''
}

const newKr = ref<Record<string, string>>({})
function addKr(objectiveId: string) {
  const t = (newKr.value[objectiveId] ?? '').trim()
  if (!t) return
  projects.addKeyResult(objectiveId, t)
  newKr.value[objectiveId] = ''
}

function removeObjective(objectiveId: string) {
  projects.deleteObjective(objectiveId)
}

const newInsight = ref<{ kind: InsightKind; title: string; body: string }>({
  kind: 'method',
  title: '',
  body: '',
})
function addInsight() {
  if (!newInsight.value.title.trim() || !project.value) return
  insights.add({
    kind: newInsight.value.kind,
    title: newInsight.value.title.trim(),
    body: newInsight.value.body.trim(),
    projectId: project.value.id,
    tags: [],
  })
  newInsight.value = { kind: 'method', title: '', body: '' }
}

const statusOptions: ProjectStatus[] = ['planning', 'in-progress', 'blocked', 'completed', 'archived']
const statusLabel: Record<ProjectStatus, string> = {
  planning: '规划',
  'in-progress': '进行',
  blocked: '受阻',
  completed: '完成',
  archived: '归档',
}

function setProgress(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value, 10)
  if (!project.value) return
  projects.updateProgress(project.value.id, v)
}

function submitCheckin() {
  if (!checkinNote.value.trim() || !project.value) return
  projects.addCheckin(project.value.id, checkinNote.value.trim())
  checkinNote.value = ''
}

function deleteTodo(todoId: string) {
  todos.remove(todoId)
}

const newTodo = ref<{ title: string; priority: TodoPriority; difficulty: TodoDifficulty }>({
  title: '',
  priority: 'medium',
  difficulty: 'medium',
})
function addTodo() {
  if (!newTodo.value.title.trim() || !project.value) return
  todos.add({
    title: newTodo.value.title.trim(),
    projectId: project.value.id,
    priority: newTodo.value.priority,
    difficulty: newTodo.value.difficulty,
  })
  newTodo.value = { title: '', priority: 'medium', difficulty: 'medium' }
}

const newResource = ref<{ title: string; kind: ResourceKind; url: string }>({
  title: '',
  kind: 'note',
  url: '',
})
function addResource() {
  if (!newResource.value.title.trim() || !project.value) return
  resources.add({
    title: newResource.value.title.trim(),
    kind: newResource.value.kind,
    projectId: project.value.id,
    url: newResource.value.url.trim() || undefined,
    tags: [],
  })
  newResource.value = { title: '', kind: 'note', url: '' }
}

const newResearch = ref<{ title: string; teaser: string }>({ title: '', teaser: '' })
function addResearch() {
  if (!newResearch.value.title.trim() || !project.value) return
  research.add({
    title: newResearch.value.title.trim(),
    teaser: newResearch.value.teaser.trim(),
    body: '',
    projectIds: [project.value.id],
    tags: [],
  })
  newResearch.value = { title: '', teaser: '' }
}
</script>

<template>
  <div v-if="project" class="space-y-16 rise">
    <div class="flex items-baseline justify-between text-sm">
      <RouterLink to="/projects" class="flex items-center gap-1.5 text-sm px-3 py-1 rounded transition-opacity hover:opacity-70" style="color: var(--color-mute); background: var(--color-surface); border: 1px solid var(--color-line)">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="8,2 4,6 8,10"/>
        </svg>
        所有项目
      </RouterLink>
      <StatusBadge :status="project.status" />
    </div>

    <header class="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
      <div class="md:col-span-8 space-y-5">
        <h1
          class="text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.05]"
          style="letter-spacing: -0.035em"
        >
          {{ project.name }}
        </h1>
        <p class="text-base max-w-2xl leading-7" style="color: var(--color-ink-soft)">
          {{ project.description }}
        </p>
      </div>
      <div class="md:col-span-4 space-y-3 text-sm" style="color: var(--color-ink-soft)">
        <div class="flex items-baseline justify-between border-b py-2.5" style="border-color: var(--color-line)">
          <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">进度</span>
          <span class="text-2xl tabular font-medium">
            {{ project.progress }}<span class="text-base" style="color: var(--color-mute)">%</span>
          </span>
        </div>
        <div class="flex items-baseline justify-between border-b py-2.5" style="border-color: var(--color-line)">
          <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">状态</span>
          <select
            class="input-line w-auto text-right"
            :value="project.status"
            @change="(ev) => projects.updateStatus(project!.id, (ev.target as HTMLSelectElement).value as ProjectStatus)"
          >
            <option v-for="o in statusOptions" :key="o" :value="o">
              {{ statusLabel[o] }}
            </option>
          </select>
        </div>
        <div class="flex items-baseline justify-between border-b py-2.5" style="border-color: var(--color-line)">
          <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">阶段</span>
          <select
            class="input-line w-auto text-right"
            :value="project.phase"
            @change="(ev) => projects.updatePhase(project!.id, (ev.target as HTMLSelectElement).value as ProjectPhase)"
          >
            <option value="started">已开始</option>
            <option value="exploring">准备/探视</option>
          </select>
        </div>
        <div class="flex items-baseline justify-between border-b py-2.5" style="border-color: var(--color-line)">
          <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">建立</span>
          <span class="tabular text-xs">{{ formatDate(project.startDate) }} · {{ relativeDays(project.startDate, new Date()) }}</span>
        </div>
        <div class="pt-3 space-y-2">
          <p class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">本地路径</p>
          <button
            class="font-mono text-xs text-left break-all transition-opacity hover:opacity-60"
            style="color: var(--color-ink-soft)"
            @click="showPath = !showPath"
          >
            {{ project.localPath }}
          </button>
          <div v-if="showPath" class="flex gap-4 pt-2">
            <button
              class="btn-link text-xs"
              @click="copyText(project.localPath).catch(() => {})"
            >复制</button>
            <a v-if="project.repoUrl" :href="project.repoUrl" target="_blank" class="btn-link text-xs">仓库 →</a>
            <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" class="btn-link text-xs">预览 →</a>
          </div>
        </div>
        <div class="pt-2">
          <ProgressBar :value="project.progress" />
        </div>
        <div class="pt-2">
          <input
            type="range"
            min="0"
            max="100"
            :value="project.progress"
            @input="setProgress"
            class="w-full"
          />
        </div>
      </div>
    </header>

    <hr class="rule" />

    <!-- 3 sections: milestones / 条件 / 瓶颈 -->
    <section class="grid grid-cols-1 md:grid-cols-12 gap-10">
      <article class="md:col-span-5 space-y-5">
        <h2 class="text-2xl font-medium">已经完成的节点</h2>
        <ul class="space-y-3 mt-4">
          <li
            v-for="m in project.milestones"
            :key="m.title"
            class="grid grid-cols-12 gap-3 py-3 border-b"
            style="border-color: var(--color-line)"
          >
            <span class="col-span-1 text-xl tabular">✓</span>
            <div class="col-span-11 space-y-1">
              <p class="text-sm">{{ m.title }}</p>
              <p class="text-xs tabular" style="color: var(--color-mute)">{{ formatDate(m.doneAt) }}</p>
            </div>
          </li>
          <li v-if="project.milestones.length === 0" class="text-sm py-3" style="color: var(--color-mute)">
            暂无节点 — 还没有跨过的山头。
          </li>
        </ul>
      </article>

      <article class="md:col-span-4 space-y-5">
        <h2 class="text-2xl font-medium">需要的条件</h2>
        <ul class="mt-4 space-y-2.5 text-sm leading-6" style="list-style: none; color: var(--color-ink-soft)">
          <li v-for="c in project.conditions" :key="c" class="flex items-baseline gap-3">
            <span class="font-mono text-xs" style="color: var(--color-mute)">·</span>
            <span>{{ c }}</span>
          </li>
          <li v-if="project.conditions.length === 0" style="color: var(--color-mute)">
            没有硬性条件 — 当前自由。
          </li>
        </ul>
      </article>

      <article class="md:col-span-3 space-y-5">
        <h2 class="text-2xl font-medium">当前的瓶颈</h2>
        <ul class="mt-4 space-y-3">
          <li
            v-for="b in project.bottlenecks"
            :key="b"
            class="text-sm pl-4 leading-6"
            style="border-left: 2px solid var(--color-warn); color: var(--color-ink-soft)"
          >
            {{ b }}
          </li>
          <li v-if="project.bottlenecks.length === 0" class="text-sm" style="color: var(--color-mute)">
            没有明显瓶颈 — 一切顺畅。
          </li>
        </ul>
      </article>
    </section>

    <hr class="rule" />

    <!-- 目标 / 关键结果 (OKR) -->
    <section>
      <div class="flex items-baseline justify-between mb-6">
        <h2 class="text-2xl font-medium">目标 / 关键结果</h2>
        <span class="text-xs" style="color: var(--color-mute)">OKR</span>
      </div>

      <form @submit.prevent="addObjective" class="flex items-baseline gap-3 border-b pb-2 mb-6" style="border-color: var(--color-line)">
        <input v-model="newObjective" class="input-line flex-1" placeholder="新增一个目标…" />
        <button type="submit" class="btn-cta" :disabled="!newObjective.trim()">添加</button>
      </form>

      <p v-if="project.objectives.length === 0" class="text-sm py-6" style="color: var(--color-mute)">
        还没有目标 — 先定一个方向。
      </p>

      <div v-for="o in project.objectives" :key="o.id" class="py-5 border-b" style="border-color: var(--color-line)">
        <div class="flex items-baseline justify-between">
          <h3 class="text-lg font-medium">{{ o.title }}</h3>
          <button class="btn-link text-xs" @click="removeObjective(o.id)">删除目标</button>
        </div>
        <ul class="mt-3 space-y-3">
          <li v-for="kr in o.keyResults" :key="kr.id" class="space-y-1.5">
            <div class="flex items-baseline justify-between gap-4">
              <p class="text-sm" style="color: var(--color-ink-soft)">{{ kr.title }}</p>
              <span class="text-xs tabular" style="color: var(--color-mute)">{{ kr.progress }}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              :value="kr.progress"
              @input="(ev) => { /* local preview — actual save on change */ }"
              @change="(ev) => projects.updateKeyResult(kr.id, { progress: parseInt((ev.target as HTMLInputElement).value, 10) })"
              class="w-full"
            />
          </li>
        </ul>
        <form @submit.prevent="addKr(o.id)" class="flex items-baseline gap-3 mt-3">
          <input v-model="newKr[o.id]" class="input-line flex-1 text-sm" placeholder="加一个关键结果…" />
          <button type="submit" class="btn-link text-sm" :disabled="!(newKr[o.id] ?? '').trim()">添加 KR</button>
        </form>
      </div>
    </section>

    <hr class="rule" />

    <!-- 学习 -->
    <section class="grid grid-cols-1 md:grid-cols-12 gap-10">
      <div class="md:col-span-3">
        <h2 class="text-2xl font-medium">关键知识 / 技能</h2>
        <p class="text-sm mt-3" style="color: var(--color-mute)">
          通过这个项目沉淀下来的可迁移能力。
        </p>
      </div>
      <ul class="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
        <li
          v-for="l in project.learning"
          :key="l"
          class="text-base leading-6 flex items-baseline gap-3 border-b py-2.5"
          style="border-color: var(--color-line)"
        >
          <span class="font-mono text-xs" style="color: var(--color-mute)">✦</span>
          <span>{{ l }}</span>
        </li>
      </ul>
    </section>

    <hr class="rule" />

    <!-- 方法 / 感悟 -->
    <section class="space-y-6">
      <div class="flex items-baseline justify-between">
        <h2 class="text-2xl font-medium">方法 / 感悟</h2>
        <span class="text-xs" style="color: var(--color-mute)">可独立，也可关联本项目</span>
      </div>

      <form @submit.prevent="addInsight" class="space-y-3 border-b pb-4" style="border-color: var(--color-line)">
        <div class="flex items-baseline gap-3">
          <select v-model="newInsight.kind" class="input-line w-auto text-sm">
            <option value="method">方法</option>
            <option value="insight">感悟</option>
          </select>
          <input v-model="newInsight.title" class="input-line flex-1" placeholder="一句话标题…" />
        </div>
        <textarea v-model="newInsight.body" rows="2" class="input-line" placeholder="展开说说（可选）"></textarea>
        <div class="flex justify-end">
          <button type="submit" class="btn-cta" :disabled="!newInsight.title.trim()">记录</button>
        </div>
      </form>

      <ul class="space-y-5">
        <li v-for="ins in relatedInsights" :key="ins.id" class="space-y-1.5">
          <div class="flex items-baseline gap-3">
            <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">{{ insightKindLabels[ins.kind] }}</span>
            <h3 class="text-base font-medium">{{ ins.title }}</h3>
          </div>
          <p v-if="ins.body" class="text-sm leading-6" style="color: var(--color-ink-soft)">{{ ins.body }}</p>
        </li>
        <li v-if="relatedInsights.length === 0" class="text-sm py-4" style="color: var(--color-mute)">
          还没有记录方法或感悟。
        </li>
      </ul>
    </section>

    <hr class="rule" />

    <!-- todo / kanban view -->
    <section>
      <div class="flex items-baseline justify-between mb-6">
        <h2 class="text-2xl font-medium">任务</h2>
        <div class="flex items-center gap-3">
          <!-- View switcher -->
          <div v-if="kanban.views.length > 0" class="flex items-center gap-1 text-sm">
            <button
              v-for="v in kanban.views"
              :key="v.id"
              class="px-2 py-1 rounded transition-colors"
              :class="kanban.currentViewId === v.id ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-stone-700'"
              @click="kanban.switchView(v.id)"
            >
              {{ v.title }}
            </button>
          </div>
          <RouterLink to="/todos" class="btn-link text-sm">全部待办 →</RouterLink>
        </div>
      </div>

      <!-- Add task form -->
      <form @submit.prevent="addTodo" class="flex flex-wrap items-baseline gap-3 border-b pb-2 mb-6" style="border-color: var(--color-line)">
        <input v-model="newTodo.title" class="input-line flex-1" placeholder="给这个项目加一个待办…" />
        <select v-model="newTodo.priority" class="input-line w-auto text-sm">
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select v-model="newTodo.difficulty" class="input-line w-auto text-sm">
          <option value="easy">易</option>
          <option value="medium">中</option>
          <option value="hard">难</option>
        </select>
        <button type="submit" class="btn-cta" :disabled="!newTodo.title.trim()">添加</button>
      </form>

      <!-- Kanban / list board -->
      <KanbanBoard :tasks="relatedTodos" :can-write="true" />
    </section>

    <hr class="rule" />

    <!-- 资料 -->
    <section>
      <div class="flex items-baseline justify-between mb-6">
        <h2 class="text-2xl font-medium">相关资料</h2>
        <RouterLink to="/resources" class="btn-link text-sm">资料库 →</RouterLink>
      </div>

      <form @submit.prevent="addResource" class="flex flex-wrap items-baseline gap-3 border-b pb-2 mb-6" style="border-color: var(--color-line)">
        <input v-model="newResource.title" class="input-line flex-1" placeholder="资料标题…" />
        <select v-model="newResource.kind" class="input-line w-auto text-sm">
          <option v-for="(label, k) in kindLabels" :key="k" :value="k">{{ label }}</option>
        </select>
        <input v-model="newResource.url" class="input-line flex-1" placeholder="链接（可选）" />
        <button type="submit" class="btn-cta" :disabled="!newResource.title.trim()">添加</button>
      </form>

      <ul class="divide-y" style="border-color: var(--color-line)">
        <li
          v-for="(r, i) in relatedResources"
          :key="r.id"
          class="grid grid-cols-12 gap-4 py-4"
          :style="{ borderTop: i === 0 ? '1px solid var(--color-line)' : 'none' }"
        >
          <span class="col-span-2 font-mono text-xs tracking-widest uppercase" style="color: var(--color-mute)">
            {{ kindLabels[r.kind] }}
          </span>
          <div class="col-span-10 space-y-1.5">
            <a
              v-if="r.url"
              :href="r.url"
              target="_blank"
              class="text-lg font-medium transition-opacity hover:opacity-60"
              style="letter-spacing: -0.01em"
            >{{ r.title }} →</a>
            <p v-else class="text-lg font-medium" style="letter-spacing: -0.01em">{{ r.title }}</p>
            <p v-if="r.summary" class="text-sm leading-6" style="color: var(--color-ink-soft)">{{ r.summary }}</p>
          </div>
        </li>
        <li v-if="relatedResources.length === 0" class="py-6 text-sm" style="color: var(--color-mute)">
          这个项目还没有挂载任何资料。
        </li>
      </ul>
    </section>

    <hr class="rule" />

    <!-- 研究 -->
    <section>
      <div class="flex items-baseline justify-between mb-6">
        <h2 class="text-2xl font-medium">相关的思考</h2>
        <RouterLink to="/research" class="btn-link text-sm">全部研究 →</RouterLink>
      </div>

      <form @submit.prevent="addResearch" class="flex flex-wrap items-baseline gap-3 border-b pb-2 mb-6" style="border-color: var(--color-line)">
        <input v-model="newResearch.title" class="input-line flex-1" placeholder="新研究主题…" />
        <input v-model="newResearch.teaser" class="input-line flex-1" placeholder="一句话概括（可选）" />
        <button type="submit" class="btn-cta" :disabled="!newResearch.title.trim()">添加</button>
      </form>

      <ul class="space-y-7">
        <li v-for="n in relatedResearch" :key="n.id" class="space-y-2">
          <RouterLink to="/research" class="block group">
            <p class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">
              {{ n.stage }} · {{ relativeDays(n.updatedAt, new Date()) }}
            </p>
            <h3 class="text-xl font-medium mt-1.5 transition-opacity hover:opacity-70" style="letter-spacing: -0.015em">
              {{ n.title }}
            </h3>
            <p class="text-sm mt-1.5 leading-6" style="color: var(--color-ink-soft)">{{ n.teaser }}</p>
          </RouterLink>
        </li>
        <li v-if="relatedResearch.length === 0" class="text-sm py-4" style="color: var(--color-mute)">
          这个项目还没有关联的研究。
        </li>
      </ul>
    </section>

    <hr class="rule" />

    <!-- 日志 -->
    <section class="space-y-6">
      <h2 class="text-2xl font-medium">最近日志</h2>

      <form @submit.prevent="submitCheckin" class="flex items-baseline gap-3 border-b pb-2" style="border-color: var(--color-line)">
        <input
          v-model="checkinNote"
          class="input-line flex-1"
          placeholder="写下今天关于这个项目最重要的一行…"
        />
        <button type="submit" class="btn-cta" :disabled="!checkinNote.trim()">
          记录
        </button>
      </form>

      <ul class="divide-y" style="border-color: var(--color-line)">
        <li
          v-for="(c, i) in project.checkins"
          :key="c.id"
          class="grid grid-cols-12 gap-4 py-4"
          :style="{ borderTop: i === 0 ? '1px solid var(--color-line)' : 'none' }"
        >
          <span class="col-span-2 text-xs tabular" style="color: var(--color-mute)">
            {{ formatDate(c.date) }}
          </span>
          <p class="col-span-10 text-sm leading-6">{{ c.note }}</p>
        </li>
        <li v-if="project.checkins.length === 0" class="py-6 text-sm" style="color: var(--color-mute)">
          还没有日志 — 写下第一条。
        </li>
      </ul>
    </section>
  </div>

  <div v-else class="py-20 text-center" style="color: var(--color-mute)">
    没找到这个项目 — 去
    <RouterLink to="/projects" class="btn-link">项目列表</RouterLink>
    看看。
  </div>
</template>