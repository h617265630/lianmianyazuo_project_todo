<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const panel = ref<HTMLElement | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="slide-over">
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end" @click.self="emit('close')">
        <div
          class="absolute inset-0"
          style="background-color: var(--overlay-bg)"
          @click="emit('close')"
        />
        <div
          ref="panel"
          class="relative w-full max-w-md h-full overflow-y-auto"
          style="background-color: var(--panel-bg); border-left: 1px solid var(--color-line)"
        >
          <header
            class="flex items-baseline justify-between px-8 py-6 border-b"
            style="border-color: var(--color-line)"
          >
            <h3 class="font-medium text-xl">{{ title }}</h3>
            <button
              class="btn-link text-sm tracking-widest uppercase"
              @click="emit('close')"
            >
              关闭
            </button>
          </header>
          <div class="px-8 py-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide-over-enter-active,
.slide-over-leave-active {
  transition: opacity 0.25s ease;
}
.slide-over-enter-from,
.slide-over-leave-to {
  opacity: 0;
}
</style>