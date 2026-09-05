<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '@/types'

const props = defineProps<{
  todos: Todo[]
}>()

const emit = defineEmits<{
  restore: [todo: Todo]
  delete: [todo: Todo]
}>()

const nTodos = computed(() => props.todos.filter(t => t.userId === 'u-n'))
const vTodos = computed(() => props.todos.filter(t => t.userId === 'u-v'))
</script>

<template>
  <div class="flex gap-4">
    <!-- n 的已完成 -->
    <div class="flex-1 min-w-0">
      <h3 class="text-xs tracking-widest uppercase mb-3 flex items-center gap-2" style="color: var(--color-mute)">
        <span class="px-1.5 py-0.5 rounded text-white text-xs" style="background: var(--color-accent)">n</span>
        n
      </h3>
      <ul class="space-y-2">
        <li
          v-for="t in nTodos"
          :key="t.id"
          class="flex items-start gap-2 py-1.5 group"
        >
          <button
            @click="emit('restore', t)"
            class="mt-0.5 text-green-500 text-xs shrink-0 hover:text-green-400"
            title="恢复为待办"
          >✓</button>
          <p class="flex-1 text-xs truncate leading-relaxed" style="color: var(--color-mute)">{{ t.title }}</p>
          <button
            @click="emit('delete', t)"
            class="text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style="color: var(--color-mute)"
          >✕</button>
        </li>
        <li v-if="nTodos.length === 0" class="text-xs py-4 text-center" style="color: var(--color-mute)">
          无
        </li>
      </ul>
    </div>

    <!-- v 的已完成 -->
    <div class="flex-1 min-w-0">
      <h3 class="text-xs tracking-widest uppercase mb-3 flex items-center gap-2" style="color: var(--color-mute)">
        <span class="px-1.5 py-0.5 rounded text-white text-xs" style="background: var(--color-ink)">v</span>
        v
      </h3>
      <ul class="space-y-2">
        <li
          v-for="t in vTodos"
          :key="t.id"
          class="flex items-start gap-2 py-1.5 group"
        >
          <button
            @click="emit('restore', t)"
            class="mt-0.5 text-green-500 text-xs shrink-0 hover:text-green-400"
            title="恢复为待办"
          >✓</button>
          <p class="flex-1 text-xs truncate leading-relaxed" style="color: var(--color-mute)">{{ t.title }}</p>
          <button
            @click="emit('delete', t)"
            class="text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style="color: var(--color-mute)"
          >✕</button>
        </li>
        <li v-if="vTodos.length === 0" class="text-xs py-4 text-center" style="color: var(--color-mute)">
          无
        </li>
      </ul>
    </div>
  </div>
</template>
