<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useResourcesStore, kindLabels } from '@/stores/resources'
import { useProjectsStore } from '@/stores/projects'
import type { ResourceItem, ResourceKind } from '@/types'
import SlideOver from '@/components/ui/SlideOver.vue'
import { formatDate, relativeDays } from '@/utils/format'

const resources = useResourcesStore()
const projects = useProjectsStore()

const query = ref('')
const kindFilter = ref<'all' | ResourceKind>('all')
const projectFilter = ref<'all' | string>('all')
const statusFilter = ref<'all' | ResourceItem['status']>('all')
const selectedTags = ref<Set<string>>(new Set())

const showAdd = ref(false)
const draft = ref<{
  title: string
  kind: ResourceKind
  projectId: string
  url: string
  author: string
  summary: string
  tags: string
  itemStatus: ResourceItem['status']
}>({
  title: '',
  kind: 'article',
  projectId: '',
  url: '',
  author: '',
  summary: '',
  tags: '',
  itemStatus: 'unread',
})

const draftTags = computed(() =>
  draft.value.tags.split(/[,，]/).map(s => s.trim()).filter(Boolean),
)

const kinds = (['all', 'article', 'video', 'doc', 'repo', 'paper', 'tool', 'note', 'book'] as const)

function toggleTag(t: string) {
  const s = new Set(selectedTags.value)
  if (s.has(t)) s.delete(t)
  else s.add(t)
  selectedTags.value = s
}

function clearFilters() {
  query.value = ''
  kindFilter.value = 'all'
  projectFilter.value = 'all'
  statusFilter.value = 'all'
  selectedTags.value = new Set()
}

function submitAdd() {
  if (!draft.value.title.trim()) return
  resources.add({
    title: draft.value.title.trim(),
    kind: draft.value.kind,
    projectId: draft.value.projectId || undefined,
    url: draft.value.url.trim() || undefined,
    author: draft.value.author.trim() || undefined,
    summary: draft.value.summary.trim() || undefined,
    tags: draftTags.value,
    status: draft.value.itemStatus,
  })
  draft.value = {
    title: '', kind: 'article', projectId: '', url: '', author: '', summary: '', tags: '', itemStatus: 'unread',
  }
  showAdd.value = false
}

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return resources.items.filter(i => {
    if (kindFilter.value !== 'all' && i.kind !== kindFilter.value) return false
    if (projectFilter.value !== 'all') {
      if (projectFilter.value === '__unassigned__' && i.projectId) return false
      if (projectFilter.value !== '__unassigned__' && i.projectId !== projectFilter.value) return false
    }
    if (statusFilter.value !== 'all' && i.status !== statusFilter.value) return false
    if (selectedTags.value.size > 0 && ![...selectedTags.value].every(t => i.tags.includes(t))) return false
    if (q) {
      const hay = (i.title + ' ' + (i.summary ?? '') + ' ' + i.tags.join(' ') + ' ' + (i.author ?? '')).toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const grouped = computed(() => {
  const m = new Map<string, ResourceItem[]>()
  visible.value.forEach(i => {
    const key = i.projectId ?? '__unassigned__'
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(i)
  })
  const keys = Array.from(m.keys()).sort((a, b) => {
    if (a === '__unassigned__') return 1
    if (b === '__unassigned__') return -1
    return projects.byId.get(a)?.name.localeCompare(projects.byId.get(b)?.name ?? '') ?? 0
  })
  return keys.map(k => ({
    projectId: k,
    projectName: k === '__unassigned__' ? '通用资料' : projects.byId.get(k)?.name ?? '?',
    items: m.get(k)!,
  }))
})

const statusLabels: Record<ResourceItem['status'], string> = {
  unread: '未读',
  reading: '在读',
  read: '已读',
  archived: '归档',
}
</script>

<template>
  <div class="space-y-12 rise">
    <header class="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
      <div class="md:col-span-8">
        <h1 class="text-4xl md:text-5xl font-medium" style="letter-spacing: -0.03em">
          外部参考与收藏
        </h1>
        <p class="text-base mt-3 max-w-xl leading-7" style="color: var(--color-ink-soft)">
          链接、文档、笔记集中在这里。可以按项目归类，按标签过滤，也可以直接全文搜索。
        </p>
      </div>
      <div class="md:col-span-4 flex md:justify-end">
        <button class="btn-cta" @click="showAdd = true">
          添加资料
        </button>
      </div>
    </header>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-0" style="border-top: 1px solid var(--color-line); border-bottom: 1px solid var(--color-line)">
      <div class="py-4 border-r px-2" style="border-color: var(--color-line)">
        <p class="text-3xl tabular font-medium">{{ resources.items.length }}</p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">总数</p>
      </div>
      <div class="py-4 border-r px-2" style="border-color: var(--color-line)">
        <p class="text-3xl tabular font-medium">
          {{ resources.items.filter(i => i.status === 'unread').length }}
        </p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">未读</p>
      </div>
      <div class="py-4 border-r px-2" style="border-color: var(--color-line)">
        <p class="text-3xl tabular font-medium">{{ resources.allTags.length }}</p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">标签</p>
      </div>
      <div class="py-4 px-2">
        <p class="text-3xl tabular font-medium">
          {{ new Set(resources.items.map(i => i.projectId).filter(Boolean)).size }}
        </p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">项目</p>
      </div>
    </section>

    <div class="space-y-6">
      <input
        v-model="query"
        placeholder="搜索标题 / 摘要 / 标签 / 作者…"
        class="input-line text-lg"
      />

      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
        <div class="md:col-span-8 flex items-baseline gap-4 flex-wrap text-sm">
          <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">类型</span>
          <button
            v-for="k in kinds"
            :key="k"
            @click="kindFilter = k"
            class="chip"
            :class="{ 'is-active': kindFilter === k }"
          >
            {{ k === 'all' ? '全部' : kindLabels[k] }}
          </button>
        </div>
        <div class="md:col-span-2">
          <select v-model="projectFilter" class="input-line text-sm">
            <option value="all">所有项目</option>
            <option value="__unassigned__">通用</option>
            <option v-for="p in projects.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <select v-model="statusFilter" class="input-line text-sm">
            <option value="all">所有状态</option>
            <option v-for="(label, k) in statusLabels" :key="k" :value="k">{{ label }}</option>
          </select>
        </div>
      </div>

      <div v-if="resources.allTags.length" class="flex items-baseline gap-3 text-xs overflow-x-auto pb-1 -mx-1 px-1">
        <span class="text-xs tracking-widest uppercase shrink-0" style="color: var(--color-mute)">标签</span>
        <button
          v-for="t in resources.allTags"
          :key="t"
          @click="toggleTag(t)"
          class="transition-opacity hover:opacity-60 shrink-0"
          :style="{
            color: selectedTags.has(t) ? 'var(--color-ink)' : 'var(--color-mute)',
          }"
        >#{{ t }}</button>
        <button class="ml-auto btn-link text-xs shrink-0" @click="clearFilters">清空筛选</button>
      </div>
    </div>

    <hr class="rule-soft" />

    <p v-if="grouped.length === 0" class="text-center py-16" style="color: var(--color-mute)">
      没有匹配的资料 — 试试调整筛选，或者
      <button class="btn-link" @click="showAdd = true">添加一条</button>。
    </p>

    <section v-for="g in grouped" :key="g.projectId" class="space-y-4">
      <header class="flex items-baseline justify-between border-b pb-2" style="border-color: var(--color-line)">
        <h2 class="text-xl font-medium">
          {{ g.projectName }}
          <span class="text-sm ml-2" style="color: var(--color-mute)">— {{ g.items.length }} 条</span>
        </h2>
        <RouterLink
          v-if="g.projectId !== '__unassigned__'"
          :to="`/projects/${g.projectId}`"
          class="btn-link text-xs"
        >进入项目 →</RouterLink>
      </header>

      <ul class="divide-y" style="border-color: var(--color-line)">
        <li
          v-for="(i, idx) in g.items"
          :key="i.id"
          class="grid grid-cols-12 gap-4 py-5 group"
          :style="{ borderTop: idx === 0 ? '1px solid var(--color-line)' : 'none' }"
        >
          <div class="col-span-9 space-y-1.5">
            <div class="flex items-baseline gap-3">
              <span class="font-mono text-xs tracking-widest uppercase shrink-0" style="color: var(--color-mute)">[{{ kindLabels[i.kind] }}]</span>
              <a
                v-if="i.url"
                :href="i.url"
                target="_blank"
                class="text-lg font-medium transition-opacity hover:opacity-60"
                style="letter-spacing: -0.01em"
              >{{ i.title }} →</a>
              <p v-else class="text-lg font-medium" style="letter-spacing: -0.01em">{{ i.title }}</p>
            </div>
            <p v-if="i.summary" class="text-sm leading-6" style="color: var(--color-ink-soft)">{{ i.summary }}</p>
            <p v-if="i.author" class="text-xs" style="color: var(--color-mute)">— {{ i.author }}</p>
            <div v-if="i.tags.length" class="flex items-baseline flex-wrap gap-2 text-xs" style="color: var(--color-mute)">
              <span v-for="t in i.tags" :key="t">#{{ t }}</span>
            </div>
          </div>
          <div class="col-span-3 text-right space-y-2 flex flex-col items-end">
            <p class="text-xs tabular" style="color: var(--color-mute)">
              {{ formatDate(i.addedAt) }} · {{ relativeDays(i.addedAt, new Date()) }}
            </p>
            <select
              class="input-line text-xs text-right w-28"
              :value="i.status"
              @change="(ev) => resources.setStatus(i.id, (ev.target as HTMLSelectElement).value as any)"
            >
              <option v-for="(label, k) in statusLabels" :key="k" :value="k">{{ label }}</option>
            </select>
            <button class="text-xs transition-opacity" style="color: var(--color-mute)" @click="resources.remove(i.id)">
              删除
            </button>
          </div>
        </li>
      </ul>
    </section>

    <SlideOver :open="showAdd" title="添加资料" @close="showAdd = false">
      <form @submit.prevent="submitAdd" class="space-y-7">
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">标题</label>
          <input v-model="draft.title" required class="input-line mt-2 text-lg" placeholder="一句话讲清楚这份资料" />
        </div>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">类型</label>
            <select v-model="draft.kind" class="input-line mt-2">
              <option v-for="(label, k) in kindLabels" :key="k" :value="k">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">关联项目</label>
            <select v-model="draft.projectId" class="input-line mt-2">
              <option value="">通用</option>
              <option v-for="p in projects.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">链接</label>
          <input v-model="draft.url" type="url" class="input-line mt-2 font-mono text-sm" placeholder="https://..." />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">作者</label>
          <input v-model="draft.author" class="input-line mt-2" />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">摘要</label>
          <textarea v-model="draft.summary" class="input-line mt-2" rows="3" />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">标签</label>
          <input v-model="draft.tags" class="input-line mt-2" placeholder="逗号分隔,例如: ESP32, E-Ink" />
        </div>
        <div>
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">状态</label>
          <select v-model="draft.itemStatus" class="input-line mt-2">
            <option v-for="(label, k) in statusLabels" :key="k" :value="k">{{ label }}</option>
          </select>
        </div>
        <div class="flex items-baseline justify-between pt-2">
          <button type="button" class="btn-link" @click="showAdd = false">取消</button>
          <button type="submit" class="btn-cta" :disabled="!draft.title.trim()">保存</button>
        </div>
      </form>
    </SlideOver>
  </div>
</template>