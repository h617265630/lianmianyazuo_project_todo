<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useResearchStore, stageLabels } from '@/stores/research'
import { useProjectsStore } from '@/stores/projects'
import type { ResearchNote, ResearchStage } from '@/types'
import SlideOver from '@/components/ui/SlideOver.vue'
import { formatDate } from '@/utils/format'

const research = useResearchStore()
const projects = useProjectsStore()

const query = ref('')
const stageFilter = ref<'all' | ResearchStage>('all')
const projectFilter = ref<'all' | string>('all')
const selected = ref<ResearchNote | null>(null)

const stages: ('all' | ResearchStage)[] = ['all', 'seedling', 'growing', 'mature', 'archived']

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return research.items
    .filter(i => {
      if (stageFilter.value !== 'all' && i.stage !== stageFilter.value) return false
      if (projectFilter.value !== 'all' && !i.projectIds.includes(projectFilter.value)) return false
      if (q) {
        const hay = (i.title + ' ' + i.teaser + ' ' + i.body + ' ' + i.tags.join(' ')).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

function projectName(id: string) {
  return projects.byId.get(id)?.name ?? id
}

function open(n: ResearchNote) {
  selected.value = n
}
function close() {
  selected.value = null
}

function fmtBody(text: string) {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
}
</script>

<template>
  <div class="space-y-12 rise">
    <header class="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
      <div class="md:col-span-8">
        <h1 class="text-4xl md:text-5xl font-medium" style="letter-spacing: -0.03em">
          沉淀下来的<br />思考与心得
        </h1>
        <p class="text-base mt-3 max-w-xl leading-7" style="color: var(--color-ink-soft)">
          研究不是资料的搬运 — 是你消化之后写下来的东西。每条研究都可以挂在若干个项目上，并按 萌芽 → 生长 → 成熟 演化。
        </p>
      </div>
      <div class="md:col-span-4 flex md:justify-end">
        <RouterLink to="/research/new" class="btn-cta">
          写一篇研究
        </RouterLink>
      </div>
    </header>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-0" style="border-top: 1px solid var(--color-line); border-bottom: 1px solid var(--color-line)">
      <div class="py-4 border-r px-2" style="border-color: var(--color-line)">
        <p class="text-3xl tabular font-medium">{{ research.stats.total }}</p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">总计</p>
      </div>
      <div class="py-4 border-r px-2" style="border-color: var(--color-line)">
        <p class="text-3xl tabular font-medium" style="color: var(--color-mute)">{{ research.stats.seedling }}</p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">萌芽</p>
      </div>
      <div class="py-4 border-r px-2" style="border-color: var(--color-line)">
        <p class="text-3xl tabular font-medium">{{ research.stats.growing }}</p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">生长</p>
      </div>
      <div class="py-4 px-2">
        <p class="text-3xl tabular font-medium" style="color: var(--color-mute)">{{ research.stats.mature }}</p>
        <p class="text-xs tracking-widest uppercase mt-1" style="color: var(--color-mute)">成熟</p>
      </div>
    </section>

    <div class="space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
        <div class="md:col-span-7">
          <input v-model="query" placeholder="搜索标题 / 摘要 / 正文 / 标签…" class="input-line text-lg" />
        </div>
        <div class="md:col-span-5 flex flex-wrap gap-3 text-sm">
          <span class="text-xs tracking-widest uppercase self-baseline" style="color: var(--color-mute)">阶段</span>
          <button
            v-for="s in stages"
            :key="s"
            @click="stageFilter = s"
            class="chip"
            :class="{ 'is-active': stageFilter === s }"
          >
            {{ s === 'all' ? '全部' : stageLabels[s] }}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-baseline gap-3">
        <span class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">项目</span>
        <button
          @click="projectFilter = 'all'"
          class="chip"
          :class="{ 'is-active': projectFilter === 'all' }"
        >所有</button>
        <button
          v-for="p in projects.projects"
          :key="p.id"
          @click="projectFilter = p.id"
          class="chip"
          :class="{ 'is-active': projectFilter === p.id }"
        >{{ p.name }}</button>
      </div>
    </div>

    <hr class="rule-soft" />

    <section v-if="visible.length === 0" class="text-center py-20" style="color: var(--color-mute)">
      这里暂时还没有研究 — 写下第一行字，就是开始。
    </section>

    <ul v-else class="divide-y" style="border-color: var(--color-line)">
      <li
        v-for="(n, idx) in visible"
        :key="n.id"
        class="grid grid-cols-12 gap-6 py-8 group cursor-pointer"
        :style="{ borderTop: idx === 0 ? '1px solid var(--color-line)' : 'none' }"
        @click="open(n)"
      >
        <div class="col-span-12 md:col-span-2 space-y-2">
          <span class="text-xs tracking-widest uppercase tabular" style="color: var(--color-mute)">
            {{ String(idx + 1).padStart(2, '0') }} · {{ formatDate(n.updatedAt) }}
          </span>
          <p class="text-xs tracking-widest uppercase">{{ stageLabels[n.stage] }}</p>
        </div>
        <div class="col-span-12 md:col-span-10 space-y-3">
          <h2 class="text-2xl md:text-3xl font-medium leading-snug transition-opacity group-hover:opacity-60" style="letter-spacing: -0.02em">
            {{ n.title }}
          </h2>
          <p class="text-base max-w-2xl leading-6 line-clamp-2" style="color: var(--color-ink-soft)">{{ n.teaser || n.body.slice(0, 80) + '…' }}</p>
          <div class="flex items-baseline gap-3 flex-wrap text-xs" style="color: var(--color-mute)" @click.stop>
            <span v-for="pid in n.projectIds" :key="pid">
              <RouterLink :to="`/projects/${pid}`" class="btn-link" @click.stop>{{ projectName(pid) }}</RouterLink>
            </span>
            <span v-if="n.tags.length">{{ n.tags.map(t => '#' + t).join(' · ') }}</span>
            <button class="btn-link text-xs ml-auto" @click.stop="open(n)">阅读 →</button>
          </div>
        </div>
      </li>
    </ul>

    <SlideOver :open="!!selected" :title="selected?.title" @close="close">
      <div v-if="selected" class="space-y-6">
        <p class="text-base leading-7" style="color: var(--color-ink-soft)">{{ selected.teaser }}</p>
        <div class="flex items-baseline gap-3 flex-wrap text-xs">
          <span class="tracking-widest uppercase">{{ stageLabels[selected.stage] }}</span>
          <span style="color: var(--color-mute)">· {{ formatDate(selected.updatedAt) }} 更新</span>
        </div>
        <div class="flex flex-wrap gap-3 text-xs" style="color: var(--color-ink-soft)">
          <RouterLink
            v-for="pid in selected.projectIds"
            :key="pid"
            :to="`/projects/${pid}`"
            class="btn-link"
          >{{ projectName(pid) }}</RouterLink>
        </div>
        <hr class="rule-soft" />
        <article class="prose">
          <p v-for="(p, i) in fmtBody(selected.body)" :key="i">{{ p }}</p>
        </article>
        <div class="flex items-center gap-3 pt-4">
          <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">阶段</label>
          <select
            class="input-line text-sm w-32"
            :value="selected.stage"
            @change="(ev) => research.setStage(selected!.id, (ev.target as HTMLSelectElement).value as ResearchStage)"
          >
            <option v-for="(label, k) in stageLabels" :key="k" :value="k">{{ label }}</option>
          </select>
          <button class="btn-link ml-auto text-xs" @click="research.remove(selected!.id); close()">
            删除
          </button>
        </div>
      </div>
    </SlideOver>

  </div>
</template>
