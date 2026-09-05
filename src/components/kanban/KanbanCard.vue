<script setup lang="ts">
import { ref } from 'vue'
import type { Todo, TodoStatus } from '@/types'
import { priorityLabels } from '@/stores/todos'
import { api } from '@/api'

const props = defineProps<{
  task: Todo
  canWrite?: boolean
}>()

const emit = defineEmits<{
  click: [task: Todo]
  statusChange: [task: Todo, newStatus: TodoStatus]
  update: [task: Todo]
  delete: [task: Todo]
}>()

const priorityColor: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const isEditingTitle = ref(false)
const editTitle = ref('')
const isEditingPriority = ref(false)
const isEditingDueDate = ref(false)
const editDueDate = ref('')

function startEditTitle(e: Event) {
  if (!props.canWrite) return
  e.stopPropagation()
  editTitle.value = props.task.title
  isEditingTitle.value = true
}

async function saveTitle(e: Event) {
  e.stopPropagation()
  const newTitle = editTitle.value.trim()
  if (newTitle && newTitle !== props.task.title) {
    try {
      const updated = await api.updateTodo(props.task.id, { title: newTitle })
      emit('update', updated)
    } catch (err) {
      console.warn('更新标题失败', err)
    }
  }
  isEditingTitle.value = false
}

function cancelTitle(e: Event) {
  e.stopPropagation()
  isEditingTitle.value = false
}

function startEditPriority(e: Event) {
  if (!props.canWrite) return
  e.stopPropagation()
  isEditingPriority.value = true
}

async function savePriority(e: Event, val: string) {
  e.stopPropagation()
  try {
    const updated = await api.updateTodo(props.task.id, { priority: val as Todo['priority'] })
    emit('update', updated)
  } catch (err) {
    console.warn('更新优先级失败', err)
  }
  isEditingPriority.value = false
}

function startEditDueDate(e: Event) {
  if (!props.canWrite) return
  e.stopPropagation()
  editDueDate.value = props.task.dueDate || ''
  isEditingDueDate.value = true
}

async function saveDueDate(e: Event) {
  e.stopPropagation()
  try {
    const updated = await api.updateTodo(props.task.id, { dueDate: editDueDate.value || undefined })
    emit('update', updated)
  } catch (err) {
    console.warn('更新日期失败', err)
  }
  isEditingDueDate.value = false
}

function deleteTask(e: Event) {
  e.stopPropagation()
  if (confirm(`确认删除「${props.task.title}」？`)) {
    emit('delete', props.task)
  }
}
</script>

<template>
  <div
    class="kanban-card group bg-white rounded-lg shadow-sm border border-stone-200 p-3 cursor-pointer hover:shadow-md transition-shadow relative"
    @click="emit('click', task)"
  >
    <!-- 删除按钮 -->
    <button
      v-if="canWrite"
      class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-xs text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      title="删除"
      @click="deleteTask"
    >
      ✕
    </button>

    <div class="flex items-start justify-between gap-2 mb-2">
      <!-- 优先级 -->
      <select
        v-if="isEditingPriority"
        class="text-xs border border-stone-200 rounded px-1 py-0.5 bg-white"
        :value="task.priority"
        @change="e => savePriority(e, (e.target as HTMLSelectElement).value)"
        @blur="isEditingPriority = false"
        @click.stop
        autofocus
      >
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <span
        v-else
        class="text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer"
        :class="priorityColor[task.priority || 'medium']"
        :style="{ opacity: canWrite ? 1 : 0.8 }"
        @click="startEditPriority"
        :title="canWrite ? '点击修改优先级' : ''"
      >
        {{ priorityLabels[task.priority || 'medium'] }}
      </span>

      <!-- 截止日期 -->
      <input
        v-if="isEditingDueDate"
        type="date"
        v-model="editDueDate"
        class="text-xs border border-stone-200 rounded px-1 py-0.5 bg-white"
        @blur="saveDueDate"
        @keydown.enter="saveDueDate"
        @keydown.esc="isEditingDueDate = false"
        @click.stop
        autofocus
      >
      <span
        v-else
        class="text-xs text-stone-400 ml-auto cursor-pointer"
        :style="{ opacity: canWrite ? 1 : 0.8 }"
        @click="startEditDueDate"
        :title="canWrite ? '点击修改日期' : ''"
      >
        {{ task.dueDate || '无日期' }}
      </span>
    </div>

    <!-- 标题 -->
    <input
      v-if="isEditingTitle"
      v-model="editTitle"
      class="text-sm text-stone-800 leading-snug w-full border border-stone-300 rounded px-1 py-0.5 mb-1"
      @blur="saveTitle"
      @keydown.enter="saveTitle"
      @keydown.esc="cancelTitle"
      @click.stop
      autofocus
    >
    <p
      v-else
      class="text-sm text-stone-800 leading-snug"
      :style="{ cursor: canWrite ? 'text' : 'default' }"
      @click="canWrite && startEditTitle($event)"
      :title="canWrite ? '点击修改标题' : ''"
    >
      {{ task.title }}
    </p>

    <p v-if="task.detail" class="text-xs text-stone-400 mt-1 line-clamp-2">
      {{ task.detail }}
    </p>

    <div class="flex items-center gap-2 mt-2">
      <select
        class="text-xs border border-stone-200 rounded px-1 py-0.5 bg-white"
        :value="task.status"
        @change="e => emit('statusChange', task, (e.target as HTMLSelectElement).value as TodoStatus)"
        @click.stop
      >
        <option value="todo">待办</option>
        <option value="doing">进行中</option>
        <option value="done">已完成</option>
      </select>

      <span
        v-if="task.percentDone"
        class="text-xs text-stone-400"
      >
        {{ task.percentDone }}%
      </span>
    </div>
  </div>
</template>
