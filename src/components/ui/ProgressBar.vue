<script setup lang="ts">
interface Props {
  value: number
  max?: number
  showLabel?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  max: 100,
  showLabel: true,
})

const pct = () => Math.max(0, Math.min(100, (props.value / props.max) * 100))
</script>

<template>
  <div class="flex items-baseline gap-4">
    <div class="bar flex-1">
      <div class="bar-fill" :style="{ transform: `scaleX(${pct() / 100})` }" />
    </div>
    <span
      v-if="showLabel"
      class="tabular text-xs"
      style="color: var(--color-mute); min-width: 3rem; text-align: right"
    >
      {{ Math.round(pct()) }}<span class="opacity-60">%</span>
    </span>
  </div>
</template>
