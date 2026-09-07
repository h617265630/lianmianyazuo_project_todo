import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { Bucket, ProjectView, Todo, TodoStatus } from '@/types'
import { api } from '@/api'

export interface KanbanBucket extends Bucket {
  tasks: Todo[]
  count: number
}

export const useKanbanStore = defineStore('kanban', () => {
  const buckets = ref<KanbanBucket[]>([])
  const views = ref<ProjectView[]>([])
  const currentViewId = ref<string | null>(null)
  const projectId = ref<string | null>(null)
  const isLoading = ref(false)

  const currentView = computed(() =>
    views.value.find(v => v.id === currentViewId.value) ?? null,
  )

  const isKanban = computed(() => currentView.value?.viewKind === 3)
  const isList = computed(() => currentView.value?.viewKind === 0)

  async function loadViews(pid: string) {
    projectId.value = pid
    isLoading.value = true
    try {
      views.value = await api.getProjectViews(pid)
      if (views.value.length > 0 && !views.value.some(view => view.id === currentViewId.value)) {
        currentViewId.value = views.value[0].id
      }
    } finally {
      isLoading.value = false
    }
  }

  function loadBucketsHome(todoList: Todo[]) {
    const statusMap: Record<string, string> = {
      todo: 'home-todo',
      doing: 'home-doing',
      done: 'home-done',
    }
    const counts: Record<string, number> = { 'home-todo': 0, 'home-doing': 0, 'home-done': 0 }
    const taskMap: Record<string, Todo[]> = { 'home-todo': [], 'home-doing': [], 'home-done': [] }
    todoList.forEach(t => {
      const bid = statusMap[t.status] ?? 'home-todo'
      taskMap[bid].push(t)
      counts[bid]++
    })
    buckets.value = [
      { id: 'home-todo', projectViewId: 'home', title: '待办', limit: 0, position: 0, tasks: taskMap['home-todo'], count: counts['home-todo'] },
      { id: 'home-doing', projectViewId: 'home', title: '进行中', limit: 0, position: 1, tasks: taskMap['home-doing'], count: counts['home-doing'] },
      { id: 'home-done', projectViewId: 'home', title: '已完成', limit: 0, position: 2, tasks: taskMap['home-done'], count: counts['home-done'] },
    ]
    views.value = [{ id: 'home', projectId: 'home', title: '首页', viewKind: 3, position: 0, bucketConfigMode: 1 }]
    currentViewId.value = 'home'
  }

  async function loadBuckets(todoList: Todo[]) {
    if (!currentViewId.value) {
      buckets.value = []
      return
    }
    const view = currentView.value
    if (!view) return

    if (view.viewKind === 3) {
      // Kanban: group tasks by bucket
      const viewBuckets: KanbanBucket[] = (view.buckets ?? []).map(b => ({
        ...b,
        tasks: [],
        count: 0,
      }))
      todoList.forEach(t => {
        // Find bucket by status mapping: todo→To Do, doing→In Progress, done→Done
        const bucketTitleMap: Record<string, string> = {
          todo: 'To Do',
          doing: 'In Progress',
          done: 'Done',
        }
        const targetTitle = bucketTitleMap[t.status] ?? 'To Do'
        const bucket = viewBuckets.find(b => b.title === targetTitle)
        if (bucket) {
          bucket.tasks.push(t)
          bucket.count++
        }
      })
      buckets.value = viewBuckets
    } else {
      // List view: single pseudo-bucket containing all tasks
      buckets.value = [{
        id: 'list',
        projectViewId: view.id,
        title: 'All Tasks',
        limit: 0,
        position: 0,
        tasks: todoList,
        count: todoList.length,
      }]
    }
  }

  function switchView(viewId: string) {
    currentViewId.value = viewId
  }

  async function addBucket(title: string) {
    if (!currentViewId.value) return
    const bucket = await api.createBucket(currentViewId.value, { title })
    buckets.value.push({ ...bucket, tasks: [], count: 0 })
  }

  async function updateBucket(bucketId: string, patch: { title?: string; limit?: number }) {
    if (!currentViewId.value) return
    const updated = await api.updateBucket(currentViewId.value, bucketId, patch)
    const i = buckets.value.findIndex(b => b.id === bucketId)
    if (i >= 0) buckets.value[i] = { ...buckets.value[i], ...updated }
  }

  async function removeBucket(bucketId: string) {
    if (!currentViewId.value) return
    await api.deleteBucket(currentViewId.value, bucketId)
    buckets.value = buckets.value.filter(b => b.id !== bucketId)
  }

  async function moveTaskToBucket(task: Todo, newStatus: TodoStatus) {
    // Optimistic update
    const oldBucketIdx = buckets.value.findIndex(b => b.tasks.some(t => t.id === task.id))
    const oldBucket = buckets.value[oldBucketIdx]
    if (oldBucket) {
      oldBucket.tasks = oldBucket.tasks.filter(t => t.id !== task.id)
      oldBucket.count--
    }
    // 首页虚拟看板用 home-* id，项目看板用 title 匹配
    const homeIdMap: Record<string, string> = { todo: 'home-todo', doing: 'home-doing', done: 'home-done' }
    const titleMap: Record<string, string> = { todo: 'To Do', doing: 'In Progress', done: 'Done' }
    const targetId = homeIdMap[newStatus] ?? titleMap[newStatus] ?? ''
    let newBucket = buckets.value.find(b => b.id === targetId || b.title === titleMap[newStatus])
    if (!newBucket && buckets.value.length > 0) {
      newBucket = buckets.value[0]
    }
    if (newBucket) {
      newBucket.tasks.unshift({ ...task, status: newStatus })
      newBucket.count++
    }
    // Persist
    await api.updateTodo(task.id, { status: newStatus })
  }

  async function createView(title: string, viewKind: number, initialBuckets?: { title: string; limit?: number; position?: number }[]) {
    if (!projectId.value) return
    const view = await api.createProjectView(projectId.value, { title, viewKind, initialBuckets })
    views.value.push(view)
    currentViewId.value = view.id
    return view
  }

  async function deleteView(viewId: string) {
    await api.deleteProjectView(viewId)
    views.value = views.value.filter(v => v.id !== viewId)
    if (currentViewId.value === viewId) {
      currentViewId.value = views.value[0]?.id ?? null
    }
  }

  return {
    // Expose buckets as mutable array so child components can mutate tasks
    buckets,
    views: readonly(views),
    currentViewId: readonly(currentViewId),
    projectId: readonly(projectId),
    isLoading: readonly(isLoading),
    currentView,
    isKanban,
    isList,
    loadViews,
    loadBuckets,
    loadBucketsHome,
    switchView,
    addBucket,
    updateBucket,
    removeBucket,
    moveTaskToBucket,
    createView,
    deleteView,
  }
})
