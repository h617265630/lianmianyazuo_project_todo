import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ResearchNote, ResearchStage } from '@/types'
import { api, type ResearchInput } from '@/api'

export const useResearchStore = defineStore('research', () => {
  const items = ref<ResearchNote[]>([])
  const isLoaded = ref(false)
  let loadingPromise: Promise<void> | null = null

  const allTags = computed(() => {
    const set = new Set<string>()
    items.value.forEach(i => i.tags.forEach(t => set.add(t)))
    return Array.from(set).sort()
  })

  const byProject = computed(() => {
    const m = new Map<string, ResearchNote[]>()
    items.value.forEach(i => {
      i.projectIds.forEach(pid => {
        if (!m.has(pid)) m.set(pid, [])
        m.get(pid)!.push(i)
      })
    })
    return m
  })

  const stats = computed(() => {
    const total = items.value.length
    const mature = items.value.filter(i => i.stage === 'mature').length
    const growing = items.value.filter(i => i.stage === 'growing').length
    const seedling = items.value.filter(i => i.stage === 'seedling').length
    return { total, mature, growing, seedling }
  })

  async function load() {
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
      try { items.value = await api.listResearch() }
      catch (e) { console.warn('[research] 后端不可用，未加载示例数据', e); items.value = [] }
      finally { isLoaded.value = true; loadingPromise = null }
    })()
    return loadingPromise
  }

  async function add(input: ResearchInput) {
    const note = await api.createResearch(input)
    items.value.unshift(note)
    return note
  }

  async function update(id: string, patch: Partial<ResearchNote>) {
    const updated = await api.updateResearch(id, patch)
    const i = items.value.findIndex(x => x.id === id)
    if (i >= 0) items.value[i] = updated
    return updated
  }

  async function remove(id: string) {
    await api.deleteResearch(id)
    items.value = items.value.filter(i => i.id !== id)
  }

  async function setStage(id: string, stage: ResearchStage) {
    await update(id, { stage })
  }

  return { items, isLoaded, allTags, byProject, stats, load, add, update, remove, setStage }
})

export const stageLabels: Record<ResearchStage, string> = {
  seedling: '萌芽',
  growing: '生长',
  mature: '成熟',
  archived: '归档',
}
