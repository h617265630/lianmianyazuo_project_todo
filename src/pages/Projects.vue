<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTodosStore } from '@/stores/todos'
import { useResourcesStore, kindLabels } from '@/stores/resources'
import { useResearchStore } from '@/stores/research'
import { useKanbanStore } from '@/stores/kanban'
import ProjectSidebar from '@/components/ProjectSidebar.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import SlideOver from '@/components/ui/SlideOver.vue'
import type { Todo, TodoStatus } from '@/types'
import { api } from '@/api'

const route = useRoute()
const projects = useProjectsStore()
const todos = useTodosStore()
const resources = useResourcesStore()
const research = useResearchStore()
const kanban = useKanbanStore()

const activeTab = ref('tasks')

// 解析当前 project id 和 tab
const projectId = computed(() => route.params.id as string | undefined)
const project = computed(() => projectId.value ? projects.byId.get(projectId.value) ?? null : null)

watch(projectId, (id) => {
  if (id) kanban.loadViews(id)
}, { immediate: true })

watch(() => route.query.tab, (tab) => {
  if (tab) activeTab.value = tab as string
}, { immediate: true })

// 当前项目数据
const projectTodos = computed(() => projectId.value ? (todos.byProject.get(projectId.value) ?? []) : [])
const projectOpenTodos = computed(() => projectTodos.value.filter((t: Todo) => t.status !== 'done'))
const projectResources = computed(() => projectId.value ? (resources.byProject.get(projectId.value) ?? []) : [])
const projectResearch = computed(() => projectId.value ? (research.byProject.get(projectId.value) ?? []) : [])

// 新增表单
const newTodoTitle = ref('')
const newResourceTitle = ref('')
const newResourceUrl = ref('')
const newResearchTitle = ref('')
const newResearchTeaser = ref('')

async function submitNewTodo() {
  if (!newTodoTitle.value.trim() || !projectId.value) return
  await todos.add({ title: newTodoTitle.value.trim(), projectId: projectId.value, priority: 'medium', difficulty: 'medium' })
  newTodoTitle.value = ''
}

async function submitNewResource() {
  if (!newResourceTitle.value.trim() || !projectId.value) return
  await resources.add({ title: newResourceTitle.value.trim(), kind: 'note', projectId: projectId.value, url: newResourceUrl.value.trim() || undefined, tags: [] })
  newResourceTitle.value = ''
  newResourceUrl.value = ''
}

async function submitNewResearch() {
  if (!newResearchTitle.value.trim() || !projectId.value) return
  await research.add({ title: newResearchTitle.value.trim(), teaser: newResearchTeaser.value.trim(), body: '', projectIds: [projectId.value], tags: [] })
  newResearchTitle.value = ''
  newResearchTeaser.value = ''
}

// ── Create project ──────────────────────────────────────────────────────────────
const showCreateProject = ref(false)
const newProject = ref({
  name: '',
  tagline: '',
  description: '',
  startDate: new Date().toISOString().slice(0, 10),
  localPath: '',
  repoUrl: '',
  liveUrl: '',
})

async function submitCreateProject() {
  const p = newProject.value
  if (!p.name.trim() || !p.tagline.trim() || !p.description.trim() || !p.startDate || !p.localPath.trim()) return
  try {
    const created = await api.createProject({
      name: p.name.trim(),
      tagline: p.tagline.trim(),
      description: p.description.trim(),
      startDate: p.startDate,
      localPath: p.localPath.trim(),
      repoUrl: p.repoUrl.trim() || undefined,
      liveUrl: p.liveUrl.trim() || undefined,
    })
    projects.projects.push(created)
    showCreateProject.value = false
    newProject.value = { name: '', tagline: '', description: '', startDate: new Date().toISOString().slice(0, 10), localPath: '', repoUrl: '', liveUrl: '' }
  } catch (e) {
    console.warn('[projects] 创建失败', e)
  }
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] overflow-hidden">
    <!-- 左侧：固定侧边栏（所有项目视图或选中项目视图） -->
    <ProjectSidebar :project-id="projectId" :active-tab="activeTab" @update:active-tab="t => { activeTab = t; if (projectId) $router.replace({ query: { tab: t } }) }" />

    <!-- 右侧主内容区 -->
    <main class="flex-1 overflow-y-auto">
      <!-- 无项目选中：项目概览 -->
      <div v-if="!projectId" class="p-8 lg:p-12 space-y-8 overflow-y-auto h-full">
        <div class="flex items-baseline justify-between">
          <div>
            <h1 class="text-4xl md:text-5xl font-medium" style="letter-spacing: -0.03em">项目管理</h1>
            <p class="text-base mt-3 leading-7" style="color: var(--color-ink-soft)">
              每一个项目都有自己的进度、所需条件、瓶颈、相关资料、学习到的关键知识与本地地址。
            </p>
          </div>
          <button class="btn-cta" @click="showCreateProject = true">+ 创建项目</button>
        </div>

        <!-- 统计概览 -->
        <div class="glass p-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-accent)">{{ projects.stats.inProgress }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">进行中</p>
          </div>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-mute)">{{ projects.stats.planning }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">规划中</p>
          </div>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-warn)">{{ projects.stats.blocked }}</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">受阻</p>
          </div>
          <div>
            <p class="text-4xl tabular font-medium" style="color: var(--color-ink)">{{ projects.stats.avgProgress }}%</p>
            <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">平均进度</p>
          </div>
        </div>

        <!-- 项目列表（可点击） -->
        <div>
          <h2 class="text-2xl font-medium mb-4">所有项目</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              v-for="p in projects.projects"
              :key="p.id"
              class="glass p-6 text-left group transition-all hover:-translate-y-0.5"
              @click="$router.push(`/projects/${p.id}`)"
            >
              <div class="flex items-baseline justify-between mb-2">
                <StatusBadge :status="p.status" class="shrink-0" />
                <span class="text-xs tabular" style="color: var(--color-mute)">{{ p.progress }}%</span>
              </div>
              <h3 class="text-xl font-medium mb-1" style="letter-spacing: -0.015em">{{ p.name }}</h3>
              <p class="text-sm truncate" style="color: var(--color-ink-soft)">{{ p.tagline }}</p>
              <div class="flex items-center gap-3 mt-3 text-xs" style="color: var(--color-mute)">
                <span>{{ (todos.byProject.get(p.id) ?? []).filter((t: Todo) => t.status !== 'done').length }} 待办</span>
                <span>{{ (resources.byProject.get(p.id) ?? []).length }} 资料</span>
                <span>{{ (research.byProject.get(p.id) ?? []).length }} 思考</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 选中项目内容 -->
      <div v-else-if="project" class="p-8 lg:p-12 space-y-8">
        <!-- 项目头部 -->
        <div class="flex items-start justify-between gap-6">
          <div class="flex-1 min-w-0">
            <h1 class="text-3xl md:text-4xl font-medium" style="letter-spacing: -0.03em">{{ project.name }}</h1>
            <p class="text-sm mt-2 leading-6" style="color: var(--color-ink-soft)">{{ project.description }}</p>
          </div>
          <StatusBadge :status="project.status" />
        </div>

        <!-- 进度 -->
        <div class="flex items-center gap-6">
          <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: var(--color-line)">
            <div
              class="h-full rounded-full transition-all"
              :style="{ width: project.progress + '%', background: 'var(--color-accent)' }"
            />
          </div>
          <span class="text-sm tabular font-medium" style="color: var(--color-ink)">{{ project.progress }}%</span>
        </div>

        <hr class="rule" />

        <!-- 任务 tab -->
        <section v-if="activeTab === 'tasks'">
          <form @submit.prevent="submitNewTodo" class="flex gap-3 mb-6">
            <input v-model="newTodoTitle" placeholder="给这个项目加一个待办…" class="input-line flex-1" />
            <button type="submit" class="btn-cta">添加</button>
          </form>
          <KanbanBoard :tasks="projectTodos" :can-write="true" />
        </section>

        <!-- 相关资料 tab -->
        <section v-else-if="activeTab === 'resources'">
          <form @submit.prevent="submitNewResource" class="flex gap-3 mb-6">
            <input v-model="newResourceTitle" placeholder="资料标题…" class="input-line flex-1" />
            <input v-model="newResourceUrl" placeholder="链接（可选）" class="input-line flex-1" />
            <button type="submit" class="btn-cta">添加</button>
          </form>
          <div v-if="projectResources.length === 0" class="py-12 text-sm text-center" style="color: var(--color-mute)">
            暂无关联资料
          </div>
          <ul v-else class="space-y-3">
            <li v-for="r in projectResources" :key="r.id" class="glass p-5 flex items-start gap-4">
              <span class="text-xs tracking-widest uppercase shrink-0 mt-0.5" style="color: var(--color-mute)">{{ kindLabels[r.kind] }}</span>
              <div class="flex-1 min-w-0">
                <a v-if="r.url" :href="r.url" target="_blank" class="text-base font-medium hover:opacity-70 transition-opacity" style="letter-spacing: -0.01em">{{ r.title }} →</a>
                <p v-else class="text-base font-medium">{{ r.title }}</p>
                <p v-if="r.summary" class="text-sm mt-1 leading-6" style="color: var(--color-ink-soft)">{{ r.summary }}</p>
              </div>
            </li>
          </ul>
        </section>

        <!-- 相关思考 tab -->
        <section v-else-if="activeTab === 'research'">
          <form @submit.prevent="submitNewResearch" class="space-y-3 mb-6">
            <input v-model="newResearchTitle" placeholder="新研究主题…" class="input-line w-full" />
            <input v-model="newResearchTeaser" placeholder="一句话概括（可选）" class="input-line w-full" />
            <div class="flex justify-end">
              <button type="submit" class="btn-cta">记录</button>
            </div>
          </form>
          <div v-if="projectResearch.length === 0" class="py-12 text-sm text-center" style="color: var(--color-mute)">
            暂无关联研究
          </div>
          <ul v-else class="space-y-5">
            <li v-for="n in projectResearch" :key="n.id" class="border-b pb-5" style="border-color: var(--color-line)">
              <p class="text-xs tracking-widest uppercase mb-1" style="color: var(--color-mute)">{{ n.stage }}</p>
              <h3 class="text-lg font-medium" style="letter-spacing: -0.015em">{{ n.title }}</h3>
              <p v-if="n.teaser" class="text-sm mt-1.5 leading-6" style="color: var(--color-ink-soft)">{{ n.teaser }}</p>
            </li>
          </ul>
        </section>
      </div>

      <!-- 项目不存在 -->
      <div v-else class="flex items-center justify-center h-full" style="color: var(--color-mute)">
        <p class="text-center text-lg">项目不存在</p>
      </div>
    </main>
  </div>

  <!-- 创建项目弹窗 -->
  <SlideOver :open="showCreateProject" title="创建项目" @close="showCreateProject = false">
    <form @submit.prevent="submitCreateProject" class="space-y-5">
      <div>
        <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">项目名称 *</label>
        <input v-model="newProject.name" required class="input-line mt-1.5 w-full text-lg" placeholder="例如：连绵雅座" autofocus />
      </div>
      <div>
        <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">一句话介绍 *</label>
        <input v-model="newProject.tagline" required class="input-line mt-1.5 w-full" placeholder="项目是做什么的" />
      </div>
      <div>
        <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">详细描述 *</label>
        <textarea v-model="newProject.description" required class="input-line mt-1.5 w-full" rows="3" placeholder="背景、目标、意义…" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">开始日期 *</label>
          <input v-model="newProject.startDate" type="date" required class="input-line mt-1.5 w-full" />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">本地路径 *</label>
          <input v-model="newProject.localPath" required class="input-line mt-1.5 w-full" placeholder="/Users/you/project" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">仓库地址</label>
          <input v-model="newProject.repoUrl" class="input-line mt-1.5 w-full" placeholder="https://github.com/..." />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">在线地址</label>
          <input v-model="newProject.liveUrl" class="input-line mt-1.5 w-full" placeholder="https://..." />
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button type="button" class="btn-link" @click="showCreateProject = false">取消</button>
        <button type="submit" class="btn-cta" :disabled="!newProject.name.trim() || !newProject.tagline.trim() || !newProject.description.trim() || !newProject.localPath.trim()">创建</button>
      </div>
    </form>
  </SlideOver>
</template>
