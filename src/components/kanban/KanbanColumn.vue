<script setup lang="ts">
import { ref } from 'vue'
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { useKanbanStore, type KanbanBucket } from '@/stores/kanban'
import KanbanCard from './KanbanCard.vue'
import type { Todo, TodoStatus } from '@/types'

const props = defineProps<{
  bucket: KanbanBucket
  canWrite?: boolean
}>()

const kanban = useKanbanStore()

const isEditingTitle = ref(false)
const editTitle = ref('')
const isDraggingOver = ref(false)

function startEdit() {
  if (!props.canWrite) return
  editTitle.value = props.bucket.title
  isEditingTitle.value = true
}

function saveTitle() {
  if (editTitle.value.trim() && editTitle.value !== props.bucket.title) {
    kanban.updateBucket(props.bucket.id, { title: editTitle.value.trim() })
  }
  isEditingTitle.value = false
}

function deleteColumn() {
  if (confirm(`删除列「${props.bucket.title}」？`)) {
    kanban.removeBucket(props.bucket.id)
  }
}

const emit = defineEmits<{
  taskUpdate: [task: Todo]
  taskDelete: [task: Todo]
}>()

function onTaskClick(task: Todo) {
  // 后期可以打开 task detail modal
  console.log('task click', task.id)
}

function onStatusChange(task: Todo, newStatus: TodoStatus) {
  kanban.moveTaskToBucket(task, newStatus)
}

function onTaskUpdate(task: Todo) {
  emit('taskUpdate', task)
}

function onTaskDelete(task: Todo) {
  emit('taskDelete', task)
}
</script>

<template>
  <div
    class="kanban-column flex flex-col min-w-0 bg-stone-100 rounded-xl"
    :class="{ 'ring-2 ring-blue-400 ring-opacity-50': isDraggingOver }"
  >
    <!-- Column Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-stone-200">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <input
          v-if="isEditingTitle"
          v-model="editTitle"
          class="text-sm font-semibold bg-white border border-stone-300 rounded px-1 py-0.5 flex-1"
          @blur="saveTitle"
          @keydown.enter="saveTitle"
          @keydown.esc="isEditingTitle = false"
          autofocus
        >
        <span
          v-else
          class="text-sm font-semibold text-stone-700 truncate cursor-pointer"
          @dblclick="startEdit"
        >
          {{ bucket.title }}
        </span>
        <span class="text-xs text-stone-400 bg-stone-200 rounded-full px-1.5 py-0.5">
          {{ bucket.count }}
        </span>
      </div>

      <button
        v-if="canWrite"
        class="text-xs text-stone-400 hover:text-red-500 ml-1"
        title="删除列"
        @click="deleteColumn"
      >
        ✕
      </button>
    </div>

    <!-- Cards -->
    <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[4rem]">
      <KanbanCard
        v-for="task in bucket.tasks"
        :key="task.id"
        :task="task"
        :can-write="canWrite"
        @click="onTaskClick"
        @status-change="onStatusChange"
        @update="onTaskUpdate"
        @delete="onTaskDelete"
      />

      <div v-if="bucket.tasks.length === 0" class="text-xs text-stone-300 text-center py-4">
        暂无任务
      </div>
    </div>
  </div>
</template>
