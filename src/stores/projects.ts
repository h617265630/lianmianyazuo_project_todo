import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, ProjectStatus, ProjectPhase } from '@/types'
import { api } from '@/api'
import { seedProjects } from '@/data/seed'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])

  const byId = computed(() => {
    const m = new Map<string, Project>()
    projects.value.forEach(p => m.set(p.id, p))
    return m
  })

  const activeProjects = computed(() => projects.value.filter(p => p.status !== 'archived'))

  const stats = computed(() => {
    const total = projects.value.length
    const inProgress = projects.value.filter(p => p.status === 'in-progress').length
    const blocked = projects.value.filter(p => p.status === 'blocked').length
    const planning = projects.value.filter(p => p.status === 'planning').length
    const completed = projects.value.filter(p => p.status === 'completed').length
    const avgProgress =
      total === 0 ? 0 : Math.round(projects.value.reduce((s, p) => s + p.progress, 0) / total)
    return { total, inProgress, blocked, planning, completed, avgProgress }
  })

  async function load() {
    try {
      projects.value = await api.listProjects()
    } catch (e) {
      console.warn('[projects] 后端不可用，回退到 seed 数据', e)
      projects.value = seedProjects
    }
  }

  function replace(id: string, updated: Project) {
    const i = projects.value.findIndex(p => p.id === id)
    if (i >= 0) projects.value[i] = updated
  }

  async function updateStatus(id: string, status: ProjectStatus) {
    replace(id, await api.updateProject(id, { status }))
  }

  async function updateProgress(id: string, progress: number) {
    replace(id, await api.updateProject(id, { progress }))
  }

  async function updatePhase(id: string, phase: ProjectPhase) {
    replace(id, await api.updateProject(id, { phase }))
  }

  async function addCheckin(id: string, note: string) {
    replace(id, await api.addCheckin(id, note))
  }

  async function addObjective(projectId: string, title: string) {
    replace(projectId, await api.addObjective(projectId, title))
  }

  async function addKeyResult(objectiveId: string, title: string, progress = 0) {
    await api.addKeyResult(objectiveId, { title, progress })
    await load()
  }

  async function updateKeyResult(id: string, patch: { title?: string; progress?: number }) {
    await api.updateKeyResult(id, patch)
    await load()
  }

  async function deleteObjective(id: string) {
    await api.deleteObjective(id)
    await load()
  }

  async function resetToSeed() {
    await api.reset()
    await load()
  }

  return {
    projects,
    byId,
    activeProjects,
    stats,
    load,
    updateStatus,
    updateProgress,
    updatePhase,
    addCheckin,
    addObjective,
    addKeyResult,
    updateKeyResult,
    deleteObjective,
    resetToSeed,
  }
})
