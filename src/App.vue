<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useProjectsStore } from '@/stores/projects'
import { useTodosStore } from '@/stores/todos'
import { useResourcesStore } from '@/stores/resources'
import { useResearchStore } from '@/stores/research'
import { useContentWidth } from '@/composables/useContentWidth'

const route = useRoute()
const projects = useProjectsStore()
const todos = useTodosStore()
const resources = useResourcesStore()
const research = useResearchStore()
const { contentWidth } = useContentWidth()

async function ensureData() {
  await Promise.all([
    projects.isLoaded ? Promise.resolve() : projects.load(),
    todos.isLoaded ? Promise.resolve() : todos.load(),
    resources.isLoaded ? Promise.resolve() : resources.load(),
    research.isLoaded ? Promise.resolve() : research.load(),
  ])
}

onMounted(ensureData)
watch(() => route.fullPath, ensureData)
</script>

<template>
  <div class="min-h-screen flex flex-col workspace-app">
    <NavBar />
    <main class="app-content flex-1 mx-auto w-full px-4 sm:px-6 lg:px-10 py-7" :class="`content-${contentWidth}`">
      <RouterView v-slot="{ Component, route }">
        <Suspense timeout="0">
          <component :is="Component" :key="route.name === 'docs' ? route.path : route.fullPath" />
          <template #fallback>
            <div class="route-loading" role="status" aria-live="polite">
              <span class="route-loading-dot" aria-hidden="true" />
              正在打开页面…
            </div>
          </template>
        </Suspense>
      </RouterView>
    </main>
    <AppFooter />
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
