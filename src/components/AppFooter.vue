<script setup lang="ts">
const sections = [
  {
    title: '工作台',
    links: [
      { label: '概览', to: '/' },
      { label: '项目', to: '/projects' },
      { label: '待办', to: '/todos' },
      { label: '研究', to: '/research' },
      { label: '资料库', to: '/resources' },
    ],
  },
]
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="mt-32 pt-10 pb-12 border-t"
    style="border-color: var(--color-line); color: var(--color-ink-soft)"
  >
    <div class="mx-auto max-w-[1600px] px-8 lg:px-12">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-10">
        <div class="md:col-span-7 space-y-3">
          <div class="flex items-baseline gap-3">
            <span
              class="inline-block w-1.5 h-1.5 rounded-full"
              style="background-color: var(--color-accent); box-shadow: 0 0 8px var(--color-accent)"
            />
            <span class="text-base font-medium" style="color: var(--color-ink)">连绵雅座</span>
          </div>
          <p class="text-sm max-w-md leading-6" style="color: var(--color-ink-soft)">
            一个安静的工作台。把散落在桌面上的项目、待办、资料与研究，一处安放、一目了然。
          </p>
        </div>
        <div class="md:col-span-3">
          <h4 class="text-xs tracking-widest uppercase mb-3" style="color: var(--color-mute)">
            索引
          </h4>
          <ul class="space-y-2">
            <li v-for="l in sections[0].links" :key="l.label">
              <RouterLink :to="l.to" class="btn-link text-sm">{{ l.label }}</RouterLink>
            </li>
          </ul>
        </div>
        <div class="md:col-span-2">
          <h4 class="text-xs tracking-widest uppercase mb-3" style="color: var(--color-mute)">
            说明
          </h4>
          <p class="text-xs leading-5" style="color: var(--color-mute)">
            数据保存在本地浏览器
            <br />不连接远端服务
          </p>
        </div>
      </div>

      <hr class="rule-soft" />

      <div
        class="flex flex-col md:flex-row md:items-baseline justify-between gap-2 text-xs"
        style="color: var(--color-mute)"
      >
        <span class="tabular">© {{ year }} 连绵雅座</span>
        <span class="font-mono">v0.1 · minimal</span>
      </div>
    </div>
  </footer>
</template>