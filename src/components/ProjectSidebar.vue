<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useTodosStore } from '@/stores/todos'
import { useResourcesStore } from '@/stores/resources'
import { useResearchStore } from '@/stores/research'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const props = defineProps<{
  projectId?: string
  activeTab?: string
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: string]
}>()

const route = useRoute()
const projects = useProjectsStore()
const todos = useTodosStore()
const resources = useResourcesStore()
const research = useResearchStore()

const project = computed(() =>
  props.projectId ? projects.byId.get(props.projectId) ?? null : null,
)

const todosCount = computed(() =>
  props.projectId ? (todos.byProject.get(props.projectId) ?? []).filter(t => t.status !== 'done').length : 0,
)
const resourcesCount = computed(() =>
  props.projectId ? (resources.byProject.get(props.projectId) ?? []).length : 0,
)
const researchCount = computed(() =>
  props.projectId ? (research.byProject.get(props.projectId) ?? []).length : 0,
)

const navItems = computed(() => [
  { key: 'tasks', label: '任务', count: todosCount.value, to: props.projectId ? `/projects/${props.projectId}?tab=tasks` : null },
  { key: 'resources', label: '相关资料', count: resourcesCount.value, to: props.projectId ? `/projects/${props.projectId}?tab=resources` : null },
  { key: 'research', label: '相关思考', count: researchCount.value, to: props.projectId ? `/projects/${props.projectId}?tab=research` : null },
])
</script>

<template>
  <div class="w-56 shrink-0 flex flex-col border-r overflow-hidden" style="border-color: var(--color-line)">
    <!-- 项目切换区 -->
    <div class="p-5 border-b" style="border-color: var(--color-line)">
      <RouterLink
        to="/projects"
        class="block text-xs tracking-widest uppercase mb-3 transition-opacity hover:opacity-60"
        style="color: var(--color-mute)"
      >
        ← 所有项目
      </RouterLink>
      <template v-if="project">
        <h2 class="text-base font-medium leading-tight mb-1" style="letter-spacing: -0.01em">{{ project.name }}</h2>
        <p class="text-xs truncate mb-2" style="color: var(--color-mute)">{{ project.tagline }}</p>
        <StatusBadge :status="project.status" />
      </template>
      <p v-else class="text-sm" style="color: var(--color-mute)">选择项目</p>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 overflow-y-auto py-3">
      <button
        v-for="item in navItems"
        :key="item.key"
        class="w-full text-left px-5 py-3 flex items-center justify-between gap-3 text-sm transition-colors group"
        :class="activeTab === item.key ? 'bg-stone-100' : 'hover:bg-stone-50'"
        @click="emit('update:activeTab', item.key)"
      >
        <span>{{ item.label }}</span>
        <span
          v-if="item.count > 0"
          class="text-xs px-1.5 py-0.5 rounded shrink-0"
          :style="{ background: activeTab === item.key ? 'var(--color-accent)' : 'var(--color-surface)', color: activeTab === item.key ? 'var(--color-bg)' : 'var(--color-mute)' }"
        >
          {{ item.count }}
        </span>
      </button>
    </nav>
  </div>
</template>
