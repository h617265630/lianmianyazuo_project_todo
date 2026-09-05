import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ResourceItem, ResourceKind } from '@/types'
import { api, type ResourceInput } from '@/api'
import { seedResources } from '@/data/seed'

export const useResourcesStore = defineStore('resources', () => {
  const items = ref<ResourceItem[]>([])

  const allTags = computed(() => {
    const set = new Set<string>()
    items.value.forEach(i => i.tags.forEach(t => set.add(t)))
    return Array.from(set).sort()
  })

  const byProject = computed(() => {
    const m = new Map<string, ResourceItem[]>()
    items.value.forEach(i => {
      const key = i.projectId ?? '__unassigned__'
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(i)
    })
    return m
  })

  async function load() {
    try {
      items.value = await api.listResources()
    } catch (e) {
      console.warn('[resources] 后端不可用，回退到 seed 数据', e)
      items.value = seedResources
    }
  }

  async function add(input: ResourceInput) {
    const item = await api.createResource(input)
    items.value.unshift(item)
    return item
  }

  async function update(id: string, patch: Partial<ResourceItem>) {
    const updated = await api.updateResource(id, patch)
    const i = items.value.findIndex(x => x.id === id)
    if (i >= 0) items.value[i] = updated
    return updated
  }

  async function remove(id: string) {
    await api.deleteResource(id)
    items.value = items.value.filter(i => i.id !== id)
  }

  async function setStatus(id: string, status: ResourceItem['status']) {
    await update(id, { status })
  }

  return { items, allTags, byProject, load, add, update, remove, setStatus }
})

export const kindLabels: Record<ResourceKind, string> = {
  article: '文章',
  video: '视频',
  doc: '文档',
  repo: '仓库',
  paper: '论文',
  tool: '工具',
  note: '笔记',
  book: '书籍',
}
