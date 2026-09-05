<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'

const route = useRoute()
const router = useRouter()
const projects = useProjectsStore()
const auth = useAuthStore()
const { theme, set } = useTheme()
const openMobile = ref(false)
const projectsOpen = ref(false)

const items = computed(() => [
  { name: '综合', to: '/docs' },
  {
    name: '项目',
    to: '/projects',
    hasChildren: true,
    children: projects.activeProjects.map(p => ({
      name: p.name,
      to: `/projects/${p.id}`,
    })),
  },
  { name: '待办', to: '/todos' },
  { name: '研究', to: '/research' },
  { name: '资料库', to: '/resources' },
])

function isActive(target: string) {
  if (target === '/') return route.path === '/' || route.path === '/docs'
  return route.path === target || route.path.startsWith(target + '/')
}

function close() {
  openMobile.value = false
  projectsOpen.value = false
}

function logout() {
  auth.logout()
  router.push('/login')
}

const isDesktop = ref(true)
function onResize() {
  isDesktop.value = window.innerWidth >= 900
}
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <header
    class="sticky top-0 z-40"
    style="background-color: var(--header-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-line)"
  >
    <div class="mx-auto max-w-[1600px] px-8 lg:px-12 h-14 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center gap-3 group" @click="close">
        <span
          class="inline-block w-1.5 h-1.5 rounded-full"
          style="background-color: var(--color-accent); box-shadow: 0 0 8px var(--color-accent)"
        />
        <span class="text-base font-medium tracking-tight" style="color: var(--color-ink)">
          连绵雅座
        </span>
      </RouterLink>

      <div class="flex items-center gap-4">
        <nav v-if="isDesktop" class="flex items-baseline gap-7">
          <template v-for="item in items" :key="item.to">
            <div
              class="relative"
              @mouseenter="item.hasChildren && isDesktop && (projectsOpen = true)"
              @mouseleave="item.hasChildren && isDesktop && (projectsOpen = false)"
            >
              <RouterLink
                :to="item.to"
                class="nav-link text-sm tracking-wide transition-colors flex items-center gap-1"
                :style="{
                  color: isActive(item.to) ? 'var(--color-ink)' : 'var(--color-ink-soft)',
                  fontWeight: isActive(item.to) ? '500' : '400',
                }"
              >
                {{ item.name }}
                <svg
                  v-if="item.hasChildren"
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                  class="transition-transform duration-150"
                  :style="{ transform: projectsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
                >
                  <polyline points="2,3.5 5,6.5 8,3.5"/>
                </svg>
              </RouterLink>
              <div
                v-if="item.hasChildren && projectsOpen"
                class="absolute left-0 top-full pt-2 fade z-50"
                role="menu"
              >
                <div
                  class="border"
                  style="min-width: 16rem; background-color: var(--dropdown-bg); border-color: var(--color-line); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 12px"
                >
                  <RouterLink
                    v-for="c in item.children"
                    :key="c.to"
                    :to="c.to"
                    class="block px-4 py-2 text-sm transition-colors"
                    style="color: var(--color-ink-soft)"
                    role="menuitem"
                    @click="projectsOpen = false"
                    @mouseover="(ev) => ((ev.currentTarget as HTMLElement).style.color = 'var(--color-ink)')"
                    @mouseleave="(ev) => ((ev.currentTarget as HTMLElement).style.color = 'var(--color-ink-soft)')"
                  >
                    {{ c.name }}
                  </RouterLink>
                </div>
              </div>
            </div>
          </template>
        </nav>

        <div class="theme-toggle" role="group" aria-label="主题切换">
          <button
            type="button"
            :class="{ 'is-active': theme === 'light' }"
            @click="set('light')"
            title="浅色主题"
          >
            浅
          </button>
          <button
            type="button"
            :class="{ 'is-active': theme === 'dark' }"
            @click="set('dark')"
            title="深色主题"
          >
            深
          </button>
        </div>

        <template v-if="auth.user">
          <div class="flex items-center gap-3 pl-2 border-l" style="border-color: var(--color-line)">
            <span class="text-sm" style="color: var(--color-ink-soft)">{{ auth.user.name }}</span>
            <button class="btn-link text-xs" @click="logout">退出</button>
          </div>
        </template>

        <button
          v-if="!isDesktop"
          class="flex items-center justify-center w-8 h-8 rounded"
          style="color: var(--color-ink-soft)"
          :aria-label="openMobile ? '关闭菜单' : '打开菜单'"
          @click="openMobile = !openMobile"
        >
          <svg v-if="!openMobile" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="2" y1="5" x2="16" y2="5"/>
            <line x1="2" y1="9" x2="16" y2="9"/>
            <line x1="2" y1="13" x2="16" y2="13"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="4" y1="4" x2="14" y2="14"/>
            <line x1="14" y1="4" x2="4" y2="14"/>
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="!isDesktop && openMobile"
      class="border-t fade"
      style="border-color: var(--color-line)"
    >
      <nav class="px-8 py-6 space-y-3">
        <div v-for="item in items" :key="item.to">
          <RouterLink
            :to="item.to"
            class="block text-base font-medium py-2"
            :style="{
              color: isActive(item.to) ? 'var(--color-ink)' : 'var(--color-ink-soft)',
            }"
            @click="close"
          >
            {{ item.name }}
          </RouterLink>
          <div v-if="item.children" class="pl-4 mt-1 space-y-1 border-l" style="border-color: var(--color-line)">
            <RouterLink
              v-for="c in item.children"
              :key="c.to"
              :to="c.to"
              class="block text-sm py-1"
              style="color: var(--color-ink-soft)"
              @click="close"
            >
              {{ c.name }}
            </RouterLink>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.nav-link:hover {
  color: var(--color-ink) !important;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-line);
  border-radius: 999px;
}

.theme-toggle button {
  border: none;
  background: transparent;
  color: var(--color-mute);
  font: inherit;
  font-size: 0.75rem;
  line-height: 1;
  padding: 5px 10px;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.theme-toggle button.is-active {
  background: var(--color-accent);
  color: var(--on-accent);
}
</style>
