<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 微 duck 文档列表
const microduckDocs = [
  { label: 'README', file: 'README.html' },
  { label: '00 概述', file: '00_readme.html' },
  { label: '01 训练入门', file: '01_训练入门.html' },
  { label: '02 多动作联合训练', file: '02_多动作联合训练.html' },
  { label: '03 让鸭子更像活物', file: '03_让鸭子更像活物.html' },
  { label: '04 人机交互', file: '04_人机交互.html' },
  { label: '05 硬件实现', file: '05_硬件实现.html' },
  { label: '06 学习路线', file: '06_学习路线.html' },
  { label: '07 打通软硬件与RL', file: '07_打通软硬件与RL的任督二脉.html' },
  { label: '08 如何阅读这个项目', file: '08_如何阅读这个项目.html' },
  { label: '09 机器人项目横向对比', file: '09_机器人项目横向对比.html' },
  { label: '10 从零造一台自己的机器人', file: '10_从零造一台自己的机器人.html' },
  { label: '分析笔记', file: 'duck_analysis.html' },
  { label: '全部文档', file: 'all-docs.html' },
]

const activeDoc = ref(route.query.doc as string || microduckDocs[0].file)
const activeProject = ref<'microduck' | 'onepagebom' | 'table'>('microduck')
const tableFileName = ref('')
const tableRows = ref<string[][]>([])
const tableError = ref('')

const BASE = '/resourcePage'
const currentUrl = computed(() => {
  if (activeProject.value === 'microduck') {
    return `${BASE}/microduck/${activeDoc.value}`
  } else {
    return `${BASE}/onepage-bom/index.html`
  }
})

function selectDoc(file: string) {
  activeDoc.value = file
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []; let cell = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted
    } else if (ch === ',' && !quoted) { row.push(cell.trim()); cell = ''
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row)
      row = []; cell = ''
    } else cell += ch
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row) }
  return rows
}
async function importTable(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  tableError.value = ''
  if (!/\.(csv|tsv)$/i.test(file.name)) { tableError.value = '目前支持 CSV 或 TSV 文件'; return }
  const text = await file.text()
  tableRows.value = parseCsv(file.name.toLowerCase().endsWith('.tsv') ? text.replace(/\t/g, ',') : text)
  tableFileName.value = file.name
  activeProject.value = 'table'
}
</script>

<template>
  <div class="flex h-screen overflow-hidden" style="margin: -2.5rem -3rem; width: calc(100% + 6rem)">
    <!-- 左侧内部导航 -->
    <aside class="w-64 shrink-0 border-r overflow-y-auto" style="border-color: var(--color-line)">
      <!-- 项目切换 -->
      <div class="p-4 border-b" style="border-color: var(--color-line)">
        <p class="text-xs tracking-widest uppercase mb-3" style="color: var(--color-mute)">项目</p>
        <div class="flex gap-2">
          <button
            class="flex-1 text-xs py-1.5 rounded transition-colors"
            :class="activeProject === 'microduck' ? 'bg-stone-800 text-white' : 'bg-stone-100'"
            :style="activeProject !== 'microduck' ? 'color: var(--color-mute)' : ''"
            @click="activeProject = 'microduck'"
          >微 Duck</button>
          <button
            class="flex-1 text-xs py-1.5 rounded transition-colors"
            :class="activeProject === 'onepagebom' ? 'bg-stone-800 text-white' : 'bg-stone-100'"
            :style="activeProject !== 'onepagebom' ? 'color: var(--color-mute)' : ''"
            @click="activeProject = 'onepagebom'"
          >一页 BOM</button>
          <label class="flex-1 text-xs py-1.5 rounded text-center cursor-pointer transition-colors" :class="activeProject === 'table' ? 'bg-stone-800 text-white' : 'bg-stone-100'">上传表格<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" class="sr-only" @change="importTable" /></label>
        </div>
      </div>

      <!-- 微 duck 文档列表 -->
      <nav v-if="activeProject === 'microduck'" class="py-2">
        <button
          v-for="doc in microduckDocs"
          :key="doc.file"
          class="w-full text-left px-5 py-2 text-sm transition-colors truncate"
          :class="activeDoc === doc.file ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50'"
          @click="selectDoc(doc.file)"
        >
          {{ doc.label }}
        </button>
      </nav>

      <!-- 一页 BOM -->
      <div v-else class="p-5 text-sm" style="color: var(--color-mute)">
        <p class="text-xs tracking-widest uppercase mb-3">文件</p>
        <a
          :href="currentUrl"
          target="_blank"
          class="block py-2 hover:opacity-70 transition-opacity"
        >
          BOM_Board1_PCB_OnePage_V1_2026-09-06.html ↗
        </a>
      </div>
      <div v-if="tableError" class="px-5 pb-4 text-xs text-red-600">{{ tableError }}</div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="flex-1 overflow-hidden">
      <iframe
        v-if="activeProject !== 'table'"
        :src="currentUrl"
        class="w-full h-full border-0"
        title="文档内容"
      />
      <div v-else class="h-full overflow-auto p-6" style="background: var(--panel-bg)">
        <div class="flex items-center justify-between gap-4 mb-5"><div><p class="eyebrow">TABLE</p><h2 class="text-xl font-medium mt-1">{{ tableFileName }}</h2></div><label class="btn-cta text-xs cursor-pointer">更换文件<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" class="sr-only" @change="importTable" /></label></div>
        <p v-if="!tableRows.length" class="empty-panel">请选择一个 CSV 或 TSV 文件</p>
        <div v-else class="overflow-auto border rounded-lg" style="border-color: var(--color-line)"><table class="min-w-full text-sm"><thead><tr><th v-for="(cell, i) in tableRows[0]" :key="i" class="text-left px-3 py-2 font-medium border-b whitespace-nowrap" style="border-color: var(--color-line); background: var(--color-line-soft)">{{ cell || `列 ${i + 1}` }}</th></tr></thead><tbody><tr v-for="(row, ri) in tableRows.slice(1)" :key="ri"><td v-for="(cell, ci) in tableRows[0]" :key="ci" class="px-3 py-2 border-b whitespace-pre-wrap" style="border-color: var(--color-line)">{{ row[ci] ?? '' }}</td></tr></tbody></table></div>
      </div>
    </main>
  </div>
</template>
