<script setup lang="ts">
import { schedulePreset, type ScheduleDraft, type ScheduleMode } from '@/utils/todoSchedule'
defineProps<{ modelValue: ScheduleDraft; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: ScheduleDraft] }>()
const choices: { value: ScheduleMode; label: string }[] = [
  { value: 'today', label: '今日待办' }, { value: 'week', label: '本周待办' }, { value: 'custom', label: '自定义时间段' },
]
</script>
<template>
  <fieldset :disabled="disabled" class="space-y-3 min-w-0">
    <legend class="text-xs mb-2" style="color: var(--color-mute)">时间安排</legend>
    <div class="flex flex-wrap gap-2">
      <button v-for="choice in choices" :key="choice.value" type="button" class="chip text-xs" :class="{ 'is-active': modelValue.mode === choice.value }" :aria-pressed="modelValue.mode === choice.value" @click="emit('update:modelValue', choice.value === 'custom' ? { ...modelValue, mode: 'custom' } : schedulePreset(choice.value))">{{ choice.label }}</button>
    </div>
    <div v-if="modelValue.mode === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label class="text-xs">开始日期<input type="date" required :value="modelValue.startDate" :max="modelValue.dueDate || undefined" class="input-line mt-1" @input="emit('update:modelValue', { ...modelValue, startDate: ($event.target as HTMLInputElement).value })" /></label>
      <label class="text-xs">结束日期<input type="date" required :value="modelValue.dueDate" :min="modelValue.startDate || undefined" class="input-line mt-1" @input="emit('update:modelValue', { ...modelValue, dueDate: ($event.target as HTMLInputElement).value })" /></label>
    </div>
    <p v-else class="text-xs" style="color: var(--color-mute)">{{ modelValue.startDate }}<template v-if="modelValue.startDate !== modelValue.dueDate"> ～ {{ modelValue.dueDate }}（周一至周日）</template></p>
  </fieldset>
</template>
