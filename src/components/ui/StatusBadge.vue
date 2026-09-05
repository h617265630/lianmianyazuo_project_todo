<script setup lang="ts">
import type { ProjectStatus } from '@/types'

const props = defineProps<{ status: ProjectStatus }>()

const labels: Record<ProjectStatus, string> = {
  planning: '规划',
  'in-progress': '进行',
  blocked: '受阻',
  completed: '完成',
  archived: '归档',
}

const variantClass: Record<ProjectStatus, string> = {
  planning: 'status-planning',
  'in-progress': 'status-progress',
  blocked: 'status-blocked',
  completed: 'status-done',
  archived: 'status-archived',
}
</script>

<template>
  <span class="status" :class="variantClass[props.status]">{{ labels[props.status] }}</span>
</template>