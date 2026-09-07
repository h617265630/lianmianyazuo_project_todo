<script setup lang="ts">
import TodoBlock from '@/components/todo-block.vue'
import type { Todo, TodoStatus } from '@/types'
defineProps<{ task: Todo; canWrite?: boolean }>()
const emit = defineEmits<{
  click: [task: Todo]
  statusChange: [task: Todo, status: TodoStatus]
  update: [task: Todo]
  delete: [task: Todo]
}>()
</script>

<template>
  <TodoBlock :task="task" :can-write="canWrite" @click="emit('click', $event)" @status-change="(task, status) => emit('statusChange', task, status)" @update="emit('update', $event)" @delete="emit('delete', $event)" />
</template>
