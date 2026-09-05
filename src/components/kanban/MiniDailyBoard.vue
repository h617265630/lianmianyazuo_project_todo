<script setup lang="ts">
import type { Todo } from '@/types'

const props = defineProps<{
  groups: { date: string; todos: Todo[] }[]
}>()

const emit = defineEmits<{
  cycleStatus: [todo: Todo]
  delete: [todo: Todo]
}>()

const priorityMark = (p: string) => p === 'high' ? '!!!' : p === 'medium' ? '!!' : '!'
const priorityColor = (p: string) =>
  p === 'high' ? 'var(--color-warn)' : p === 'medium' ? 'var(--color-ink)' : 'var(--color-mute)'
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="g in groups"
      :key="g.date"
    >
      <p class="text-xs tracking-widest uppercase py-1" style="color: var(--color-mute)">
        {{ g.date }}
      </p>
      <ul class="space-y-1">
        <li
          v-for="t in g.todos"
          :key="t.id"
          class="flex items-start gap-2 py-1 group"
        >
          <button
            @click="emit('cycleStatus', t)"
            class="mt-0.5 text-xs shrink-0 hover:opacity-60 transition-opacity"
            :style="{ color: priorityColor(t.priority) }"
          >
            <span class="font-mono">{{ priorityMark(t.priority) }}</span>
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-xs truncate leading-relaxed">{{ t.title }}</p>
            <p class="text-xs flex items-center gap-2" style="color: var(--color-line)">
              <span v-if="t.userId === 'u-n'" class="text-amber-400">n</span>
              <span v-else-if="t.userId === 'u-v'" class="text-gray-400">v</span>
              <span v-if="t.status === 'doing'" class="text-yellow-500">进行中</span>
            </p>
          </div>
          <button
            @click="emit('delete', t)"
            class="text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style="color: var(--color-mute)"
          >✕</button>
        </li>
      </ul>
    </div>
    <p v-if="groups.length === 0" class="text-xs py-4 text-center" style="color: var(--color-mute)">
      暂无带截止日期的待办
    </p>
  </div>
</template>
