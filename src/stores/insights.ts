import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Insight, InsightKind } from '@/types'
import { api, type InsightInput } from '@/api'
import { seedInsights } from '@/data/seed'

export const useInsightsStore = defineStore('insights', () => {
  const items = ref<Insight[]>([])

  const methods = computed(() => items.value.filter(i => i.kind === 'method'))
  const insights = computed(() => items.value.filter(i => i.kind === 'insight'))

  const byProject = computed(() => {
    const m = new Map<string, Insight[]>()
    items.value.forEach(i => {
      const key = i.projectId ?? '__unassigned__'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(i)
    })
    return m
  })

  async function load() {
    try {
      items.value = await api.listInsights()
    } catch (e) {
      console.warn('[insights] 后端不可用，回退到 seed 数据', e)
      items.value = seedInsights
    }
  }

  async function add(input: InsightInput) {
    const item = await api.createInsight(input)
    items.value.unshift(item)
    return item
  }

  async function update(id: string, patch: Partial<Insight>) {
    const updated = await api.updateInsight(id, patch)
    const i = items.value.findIndex(x => x.id === id)
    if (i >= 0) items.value[i] = updated
    return updated
  }

  async function remove(id: string) {
    await api.deleteInsight(id)
    items.value = items.value.filter(x => x.id !== id)
  }

  return { items, methods, insights, byProject, load, add, update, remove }
})

export const insightKindLabels: Record<InsightKind, string> = {
  method: '方法',
  insight: '感悟',
}
