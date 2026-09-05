<script setup lang="ts">
import { watch, ref, computed } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useKanbanStore } from '@/stores/kanban'
import KanbanColumn from './KanbanColumn.vue'
import type { Todo, TodoStatus } from '@/types'

const props = defineProps<{
  tasks: Todo[]
  canWrite?: boolean
  forceKanban?: boolean
}>()

const kanban = useKanbanStore()

const isHomeView = computed(() => kanban.currentViewId === 'home' || props.forceKanban)

// Reload buckets whenever tasks or current view changes
watch(
  () => [props.tasks, kanban.currentViewId],
  () => {
    if (isHomeView.value) {
      kanban.loadBucketsHome(props.tasks)
    } else {
      kanban.loadBuckets(props.tasks)
    }
  },
  { immediate: true },
)

const emit = defineEmits<{
  taskUpdate: [task: Todo]
  taskDelete: [task: Todo]
}>()

function addColumn() {
  if (isHomeView.value) return
  const title = prompt('新列名称：')
  if (title?.trim()) kanban.addBucket(title.trim())
}

function onTaskUpdate(task: Todo) {
  emit('taskUpdate', task)
}

function onTaskDelete(task: Todo) {
  emit('taskDelete', task)
}
</script>

<template>
  <div class="kanban-board flex gap-3 overflow-x-auto p-1">
    <!-- List View -->
    <template v-if="kanban.isList">
      <div class="flex-1 min-w-0">
        <div class="bg-white rounded-xl shadow-sm border border-stone-200 p-4">
          <div class="space-y-2">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="flex items-center gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100 hover:border-stone-300 cursor-pointer transition-colors"
            >
              <span class="text-xs text-stone-400 w-16">{{ task.horizon }}</span>
              <span class="text-sm flex-1">{{ task.title }}</span>
              <span
                class="text-xs px-1.5 py-0.5 rounded"
                :class="{
                  'bg-amber-100 text-amber-700': task.priority === 'high',
                  'bg-stone-100 text-stone-500': task.priority !== 'high',
                }"
              >
                {{ task.priority }}
              </span>
              <select
                class="text-xs border border-stone-200 rounded px-1 py-0.5 bg-white"
                :value="task.status"
                @change="e => kanban.moveTaskToBucket(task, (e.target as HTMLSelectElement).value as TodoStatus)"
              >
                <option value="todo">待办</option>
                <option value="doing">进行中</option>
                <option value="done">已完成</option>
              </select>
            </div>
            <div v-if="tasks.length === 0" class="text-sm text-stone-300 text-center py-8">
              暂无任务
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Kanban View -->
    <template v-else-if="kanban.isKanban">
      <div class="grid gap-3 w-full" :style="{ gridTemplateColumns: `repeat(${kanban.buckets.length}, minmax(0, 1fr))` }">
        <KanbanColumn
          v-for="bucket in kanban.buckets"
          :key="bucket.id"
          :bucket="bucket"
          :can-write="canWrite"
          @task-update="onTaskUpdate"
          @task-delete="onTaskDelete"
        />
      </div>

      <!-- 添加列仅在项目视图可用，首页是固定三列 -->
      <button
        v-if="canWrite && !isHomeView"
        class="shrink-0 w-64 h-12 flex items-center justify-center gap-1 text-sm text-stone-400 border-2 border-dashed border-stone-200 rounded-xl hover:border-stone-400 hover:text-stone-600 transition-colors"
        @click="addColumn"
      >
        + 添加列
      </button>
    </template>

    <!-- Loading -->
    <template v-else-if="kanban.isLoading">
      <div class="flex items-center justify-center flex-1 py-12 text-stone-400">
        加载中...
      </div>
    </template>
  </div>
</template>
