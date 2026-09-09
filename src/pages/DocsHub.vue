<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, ChevronDown, ChevronRight, CircuitBoard, ExternalLink, FileText, FolderOpen, List, PanelLeftClose, PanelLeftOpen, Search, Table2, Upload, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const BASE = '/resourcePage'
const microduckDocs = [
  { label: 'README', file: 'README.html', group: '项目导览' },
  { label: '00 概述', file: '00_readme.html', group: '项目导览' },
  { label: '08 如何阅读这个项目', file: '08_如何阅读这个项目.html', group: '项目导览' },
  { label: '01 训练入门', file: '01_训练入门.html', group: '训练与实践' },
  { label: '02 多动作联合训练', file: '02_多动作联合训练.html', group: '训练与实践' },
  { label: '03 让鸭子更像活物', file: '03_让鸭子更像活物.html', group: '训练与实践' },
  { label: '04 人机交互', file: '04_人机交互.html', group: '训练与实践' },
  { label: '05 硬件实现', file: '05_硬件实现.html', group: '训练与实践' },
  { label: '06 学习路线', file: '06_学习路线.html', group: '延伸阅读' },
  { label: '07 打通软硬件与 RL', file: '07_打通软硬件与RL的任督二脉.html', group: '延伸阅读' },
  { label: '09 机器人项目横向对比', file: '09_机器人项目横向对比.html', group: '延伸阅读' },
  { label: '10 从零造一台自己的机器人', file: '10_从零造一台自己的机器人.html', group: '延伸阅读' },
  { label: '分析笔记', file: 'duck_analysis.html', group: '延伸阅读' },
  { label: '全部文档', file: 'all-docs.html', group: '延伸阅读' },
]
const chapters = [
  { id: 'intro', label: '设计总览' }, { id: 'architecture', label: '电源与系统' },
  { id: 'parts', label: '元器件选择' }, { id: 'power', label: '电源深读' },
  { id: 'epd', label: '电子纸驱动' }, { id: 'input', label: '按键与 IO' },
  { id: 'pcb', label: 'PCB 与结构' }, { id: 'software', label: '软硬件协同' },
  { id: 'risks', label: '资料差异与复核' }, { id: 'lab', label: '续航实验室' },
  { id: 'build', label: '复刻与改进' }, { id: 'sources', label: '来源与原始资料' },
]
// Keep existing /docs?doc=... links working; all resource paths come from this allowlist.
const project = computed(() => {
  if (route.query.project === 'table') return 'table'
  if (route.query.project === 'microduck' || (!route.query.project && microduckDocs.some(d => d.file === route.query.doc))) return 'microduck'
  return 'onepage'
})
const isBom = computed(() => route.query.project === 'onepagebom' || route.query.doc === 'bom')
const selectedDuck = computed(() => microduckDocs.find(d => d.file === route.query.doc) ?? microduckDocs[0]!)
const isReport = computed(() => project.value === 'onepage' && !isBom.value)
const section = computed(() => chapters.find(c => c.id === route.query.section)?.id ?? '')
const currentTitle = computed(() => project.value === 'table' ? '表格预览' : project.value === 'microduck' ? selectedDuck.value.label : isBom.value ? '一页 BOM' : '壹页电纸书 · PCB 设计研究')
const currentUrl = computed(() => project.value === 'table' ? '' : project.value === 'microduck' ? `${BASE}/microduck/${selectedDuck.value.file}` : isBom.value ? `${BASE}/onepage-bom/index.html` : `${BASE}/onepage-analysis/index.html`)
const standaloneUrl = computed(() => currentUrl.value + (isReport.value && section.value ? `#${section.value}` : ''))
const search = ref('')
const searchTerm = computed(() => search.value.trim().toLowerCase())
const matches = (...text: string[]) => text.join(' ').toLowerCase().includes(searchTerm.value)
const showOnepage = computed(() => matches('壹页 一页 OnePage 电纸书 PCB 设计研究 硬件 BOM', ...chapters.map(c => c.label)))
const showReport = computed(() => matches('壹页 一页 OnePage 电纸书 PCB 设计研究 硬件 分析报告', ...chapters.map(c => c.label)))
const showBom = computed(() => matches('壹页 一页 OnePage 电纸书 BOM 物料表'))
const filteredChapters = computed(() => chapters.filter(c => matches(c.label, '壹页 一页 OnePage PCB 电纸书')))
const duckGroups = computed(() => ['项目导览', '训练与实践', '延伸阅读'].map(label => ({ label, docs: microduckDocs.filter(d => d.group === label && matches(d.label, d.group, '微 Duck microduck 机器人')) })).filter(g => g.docs.length))
const openGroups = ref({ onepage: true, microduck: project.value === 'microduck' })
const collapsed = ref(false)
const mobileOpen = ref(false)
const isMobile = ref(window.innerWidth < 768)
const sidebarVisible = computed(() => isMobile.value ? mobileOpen.value : !collapsed.value)
const frame = ref<HTMLIFrameElement>()
const loading = ref(true)
const frameError = ref(false)
const activeChapter = ref(section.value)
let detachScroll: (() => void) | undefined
function onResize() { isMobile.value = window.innerWidth < 768 }
onMounted(() => window.addEventListener('resize', onResize))
onBeforeUnmount(() => { window.removeEventListener('resize', onResize); detachScroll?.() })
function toggleSidebar() { if (isMobile.value) mobileOpen.value = !mobileOpen.value; else collapsed.value = !collapsed.value }
function location(p: string, doc?: string, chapter?: string) {
  return { path: '/docs', query: { project: p, ...(doc ? { doc } : {}), ...(chapter ? { section: chapter } : {}) } }
}
function selected() { mobileOpen.value = false }
function selectChapter(id: string) {
  selected()
  if (!loading.value) {
    frame.value?.contentDocument?.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
    activeChapter.value = id
  }
}
function scrollToChapter() {
  if (!isReport.value || loading.value) return
  const doc = frame.value?.contentDocument
  activeChapter.value = section.value
  if (section.value) doc?.getElementById(section.value)?.scrollIntoView({ behavior: 'instant' })
  else frame.value?.contentWindow?.scrollTo(0, 0)
}
function frameLoaded() {
  loading.value = false
  frameError.value = false
  detachScroll?.()
  if (!isReport.value) return
  const win = frame.value?.contentWindow
  const doc = frame.value?.contentDocument
  if (!win || !doc?.getElementById('intro')) { frameError.value = true; return }
  scrollToChapter()
  let pending = 0
  function update() {
    pending = 0
    activeChapter.value = chapters.filter(c => (doc!.getElementById(c.id)?.getBoundingClientRect().top ?? Infinity) <= 100).at(-1)?.id ?? ''
  }
  const onScroll = () => { if (!pending) pending = win.requestAnimationFrame(update) }
  win.addEventListener('scroll', onScroll, { passive: true })
  detachScroll = () => { win.removeEventListener('scroll', onScroll); if (pending) win.cancelAnimationFrame(pending) }
}
watch(currentUrl, () => { loading.value = true; frameError.value = false; activeChapter.value = ''; detachScroll?.() })
watch(section, () => nextTick(scrollToChapter))
watch(project, p => { if (p !== 'table') openGroups.value[p] = true })

const fileInput = ref<HTMLInputElement>()
const tableFileName = ref('')
const tableRows = ref<string[][]>([])
const tableError = ref('')
const importing = ref(false)
function parseDelimited(text: string, delimiter: string) {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted
    } else if (ch === delimiter && !quoted) { row.push(cell.trim()); cell = '' }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row)
      row = []; cell = ''
    } else cell += ch
  }
  if (quoted) throw new Error('表格引号未闭合，请检查文件格式')
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row) }
  return rows
}
async function importTable(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  tableError.value = ''
  importing.value = true
  try {
    if (!/\.(csv|tsv)$/i.test(file.name)) throw new Error('请选择 CSV 或 TSV 文件')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8'
    const text = new TextDecoder(encoding).decode(bytes)
    const delimiter = file.name.toLowerCase().endsWith('.tsv') || text.split(/\r?\n/, 1)[0]?.includes('\t') ? '\t' : ','
    const rows = parseDelimited(text, delimiter)
    if (!rows.length) throw new Error('文件中没有可预览的表格内容')
    tableRows.value = rows
    tableFileName.value = file.name
    await router.push(location('table'))
    selected()
  } catch (error) { tableError.value = error instanceof Error ? error.message : '文件读取失败，请重试' }
  finally { importing.value = false; input.value = '' }
}
</script>

<template>
  <div class="docs-workspace">
    <header class="reader-toolbar">
      <button class="icon-button" :aria-label="sidebarVisible ? '收起资料目录' : '展开资料目录'" :aria-expanded="sidebarVisible" aria-controls="docs-sidebar" @click="toggleSidebar">
        <PanelLeftClose v-if="sidebarVisible" :size="19" /><PanelLeftOpen v-else :size="19" />
      </button>
      <div class="reader-heading"><span>综合 <ChevronRight :size="12" /> {{ project === 'microduck' ? '微 Duck' : project === 'table' ? '阅读工具' : '壹页 OnePage' }}</span><h1>{{ currentTitle }}</h1></div>
      <a v-if="currentUrl" :href="standaloneUrl" target="_blank" rel="noopener" class="reader-external" aria-label="在新窗口打开当前文档"><ExternalLink :size="15" /><span>独立打开</span></a>
    </header>
    <div class="docs-body">
      <aside v-show="sidebarVisible" id="docs-sidebar" class="docs-sidebar" aria-label="综合资料目录">
        <div class="sidebar-heading"><div><p>资料目录</p><span>按项目整理，随时接着读</span></div><FolderOpen :size="19" /></div>
        <div class="sidebar-search"><Search :size="15" /><input v-model="search" type="search" placeholder="搜索文档或章节" aria-label="搜索文档或章节" /><button v-if="search" class="icon-button" aria-label="清空搜索" @click="search = ''"><X :size="14" /></button></div>
        <nav class="docs-nav" aria-label="项目文档">
          <section v-if="showOnepage" class="nav-group">
            <button class="group-toggle" :aria-expanded="!!searchTerm || openGroups.onepage" aria-controls="onepage-docs" @click="openGroups.onepage = !openGroups.onepage"><CircuitBoard :size="17" /><span>壹页 OnePage</span><small>2</small><ChevronDown v-if="searchTerm || openGroups.onepage" :size="14" /><ChevronRight v-else :size="14" /></button>
            <div v-show="searchTerm || openGroups.onepage" id="onepage-docs" class="group-content">
              <RouterLink v-if="showReport" :to="location('onepage', 'analysis')" class="doc-link" :class="{ selected: isReport }" :aria-current="isReport ? 'page' : undefined" @click="selected"><FileText :size="15" /><span>PCB 设计研究<small>电路、选型与设计取舍</small></span></RouterLink>

              <RouterLink v-if="showBom" :to="location('onepage', 'bom')" class="doc-link" :class="{ selected: project === 'onepage' && isBom }" :aria-current="project === 'onepage' && isBom ? 'page' : undefined" @click="selected"><Table2 :size="15" /><span>一页 BOM<small>原有物料清单</small></span></RouterLink>
            </div>
          </section>
          <section v-if="duckGroups.length" class="nav-group">
            <button class="group-toggle" :aria-expanded="!!searchTerm || openGroups.microduck" aria-controls="microduck-docs" @click="openGroups.microduck = !openGroups.microduck"><BookOpen :size="17" /><span>微 Duck</span><small>{{ microduckDocs.length }}</small><ChevronDown v-if="searchTerm || openGroups.microduck" :size="14" /><ChevronRight v-else :size="14" /></button>
            <div v-show="searchTerm || openGroups.microduck" id="microduck-docs" class="group-content"><div v-for="group in duckGroups" :key="group.label"><p class="subgroup-title">{{ group.label }}</p><RouterLink v-for="doc in group.docs" :key="doc.file" :to="location('microduck', doc.file)" class="doc-link duck-link" :class="{ selected: project === 'microduck' && selectedDuck.file === doc.file }" :aria-current="project === 'microduck' && selectedDuck.file === doc.file ? 'page' : undefined" @click="selected"><FileText :size="14" /><span>{{ doc.label }}</span></RouterLink></div></div>
          </section>
          <details v-if="isReport && filteredChapters.length" class="chapter-list" open><summary><List :size="13" /> PCB 研究 · 本文目录 <ChevronDown :size="13" /></summary><RouterLink v-for="(chapter) in filteredChapters" :key="chapter.id" :to="location('onepage', 'analysis', chapter.id)" class="chapter-link" :class="{ current: activeChapter === chapter.id }" :aria-current="activeChapter === chapter.id ? 'location' : undefined" @click="selectChapter(chapter.id)"><span>{{ String(chapters.indexOf(chapter) + 1).padStart(2, '0') }}</span>{{ chapter.label }}</RouterLink></details>
          <p v-if="!showOnepage && !duckGroups.length" class="search-empty" role="status">没有找到“{{ search }}”<br><button @click="search = ''">清空搜索，查看全部资料</button></p>
        </nav>
        <div class="sidebar-tools"><p class="subgroup-title">阅读工具</p><RouterLink :to="location('table')" class="doc-link" :class="{ selected: project === 'table' }" :aria-current="project === 'table' ? 'page' : undefined" @click="selected"><Upload :size="16" /><span>表格预览<small>{{ tableFileName || '导入 CSV / TSV' }}</small></span></RouterLink><p class="local-note">导入的表格仅在当前页面预览</p></div>
      </aside>
      <div class="reader-content" :aria-busy="loading && project !== 'table'">
        <template v-if="project !== 'table'">
          <p v-if="loading" class="reader-state" role="status">正在打开文档…</p>
          <div v-if="frameError" class="reader-state" role="alert">文档未能加载。<a :href="standaloneUrl" target="_blank" rel="noopener">尝试独立打开</a></div>
          <iframe :key="currentUrl" ref="frame" :src="currentUrl" :title="currentTitle" class="doc-frame" @load="frameLoaded" @error="loading = false; frameError = true" />
        </template>
        <div v-else class="table-view">
          <div class="table-heading"><div><h2>{{ tableFileName || '打开一份表格' }}</h2><p>{{ tableRows.length ? `${Math.max(0, tableRows.length - 1)} 行数据 · ${tableRows[0]?.length} 列` : '支持 CSV、TSV，文件留在你的浏览器中。' }}</p></div><button class="btn-quiet" :disabled="importing" @click="fileInput?.click()"><Upload :size="15" />{{ importing ? '正在读取…' : tableFileName ? '更换文件' : '选择文件' }}</button></div>
          <p v-if="tableError" class="table-error" role="alert">{{ tableError }}</p>
          <div v-if="!tableRows.length" class="table-empty"><Table2 :size="36" /><p>物料清单、数据记录，都可以在这里查看。</p><span>支持带引号的字段及 UTF-16 编码的 BOM 文件</span></div>
          <div v-else class="table-scroll"><table><thead><tr><th v-for="(cell, i) in tableRows[0]" :key="i">{{ cell || `列 ${i + 1}` }}</th></tr></thead><tbody><tr v-for="(row, ri) in tableRows.slice(1)" :key="ri"><td v-for="(_, ci) in tableRows[0]" :key="ci">{{ row[ci] ?? '' }}</td></tr></tbody></table></div>
        </div>
      </div>
    </div>
    <input ref="fileInput" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" class="sr-only" aria-label="选择表格文件" @change="importTable" />
  </div>
</template>

<style scoped>
.docs-workspace { display: flex; flex-direction: column; height: calc(100dvh - 122px); min-height: 480px; border: 1px solid var(--color-line); border-radius: 12px; background: var(--panel-bg); overflow: hidden; }
.reader-toolbar { display: flex; align-items: center; gap: 14px; min-height: 68px; padding: 12px 20px; border-bottom: 1px solid var(--color-line); flex-shrink: 0; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; color: var(--color-mute); cursor: pointer; flex-shrink: 0; }
.icon-button:hover { background: var(--hover-bg); color: var(--color-ink); }
.reader-heading { min-width: 0; flex: 1; }
.reader-heading > span { display: flex; align-items: center; gap: 7px; font-size: 10px; color: var(--color-mute); }
.reader-heading h1 { font-size: 15px; line-height: 1.5; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.reader-external { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--color-mute); flex-shrink: 0; padding: 8px; border-radius: 6px; }
.reader-external:hover { background: var(--hover-bg); color: var(--color-ink); }
.docs-body { display: flex; flex: 1; min-height: 0; }
.docs-sidebar { display: flex; flex-direction: column; width: 264px; flex-shrink: 0; border-right: 1px solid var(--color-line); background: var(--color-surface); min-height: 0; }
.sidebar-heading { display: flex; align-items: center; justify-content: space-between; padding: 22px 20px 15px; color: var(--color-mute); }
.sidebar-heading p { font-size: 15px; color: var(--color-ink); font-weight: 600; }
.sidebar-heading span { font-size: 11px; }
.sidebar-search { display: flex; align-items: center; gap: 8px; margin: 0 14px 15px; padding: 3px 10px; border: 1px solid var(--color-line); border-radius: 7px; color: var(--color-mute); background: var(--color-paper); min-height: 36px; }
.sidebar-search:focus-within { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.sidebar-search input { min-width: 0; width: 100%; outline: none; background: transparent; color: var(--color-ink); font-size: 12px; padding: 5px 0; }
.sidebar-search input::-webkit-search-cancel-button { display: none; }
.sidebar-search .icon-button { width: 20px; height: 24px; }
.docs-nav { flex: 1; min-height: 0; overflow: auto; padding: 0 10px 12px; scrollbar-gutter: stable; }
.nav-group + .nav-group { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--color-line-soft); }
.group-toggle { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 8px; border-radius: 6px; text-align: left; color: var(--color-ink-soft); cursor: pointer; }
.group-toggle:hover { background: var(--hover-bg); }
.group-toggle > span { flex: 1; font-size: 13px; font-weight: 600; }
.group-toggle small { font-size: 10px; color: var(--color-mute); margin-right: 3px; }
.group-content { padding: 3px 0; }
.doc-link { display: flex; align-items: flex-start; gap: 9px; position: relative; padding: 10px 12px; margin: 2px 0; font-size: 12px; line-height: 1.5; border-radius: 7px; color: var(--color-ink-soft); text-decoration: none; }
.doc-link svg { flex-shrink: 0; margin-top: 2px; }
.doc-link > span { min-width: 0; overflow-wrap: anywhere; }
.doc-link small { display: block; color: var(--color-mute); font-size: 10px; margin-top: 3px; }
.doc-link:hover { background: var(--hover-bg); }
.doc-link.selected { background: var(--color-accent-soft); color: var(--color-accent); font-weight: 600; }
.doc-link.selected::before { content: ''; position: absolute; top: 12px; bottom: 12px; left: 0; width: 3px; background: var(--color-accent); border-radius: 4px; }
.chapter-list { border-left: 1px solid var(--color-line); margin: 10px 8px 14px 18px; padding-left: 10px; }
.chapter-list > summary { display: flex; align-items: center; gap: 6px; padding: 6px 7px 10px; font-size: 11px; color: var(--color-mute); cursor: pointer; list-style: none; }.chapter-list > summary::-webkit-details-marker { display: none; }.chapter-list > summary svg:last-child { margin-left: auto; }.chapter-list:not([open]) > summary svg:last-child { transform: rotate(-90deg); }
.chapter-link { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--color-mute); padding: 5px 7px; border-radius: 5px; text-decoration: none; }
.chapter-link > span { font-size: 9px; font-variant-numeric: tabular-nums; opacity: .75; }
.chapter-link:hover, .chapter-link.current { background: var(--hover-bg); color: var(--color-accent); }
.chapter-link.current { font-weight: 600; }
.subgroup-title { padding: 12px 12px 5px; font-size: 10px; color: var(--color-mute); letter-spacing: .04em; }
.duck-link { padding-top: 8px; padding-bottom: 8px; }
.sidebar-tools { padding: 6px 12px 14px; border-top: 1px solid var(--color-line); }
.sidebar-tools .subgroup-title { padding-top: 7px; }
.local-note { padding-left: 12px; margin-top: 8px; font-size: 10px; color: var(--color-mute); }
.search-empty { padding: 25px 12px; font-size: 12px; color: var(--color-mute); overflow-wrap: anywhere; }
.search-empty button { color: var(--color-accent); font-size: 11px; margin-top: 8px; cursor: pointer; }
.reader-content { flex: 1; min-width: 0; min-height: 0; position: relative; }
.doc-frame { display: block; width: 100%; height: 100%; border: 0; background: var(--panel-bg); }
.reader-state { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px; background: var(--panel-bg); color: var(--color-mute); font-size: 13px; z-index: 1; }
.reader-state a { text-decoration: underline; }
.table-view { height: 100%; overflow: auto; padding: 28px; }
.table-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.table-heading h2 { font-size: 20px; line-height: 1.5; overflow-wrap: anywhere; }
.table-heading p { font-size: 12px; color: var(--color-mute); margin-top: 5px; }
.table-heading button { flex-shrink: 0; }
.table-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; gap: 15px; color: var(--color-mute); text-align: center; }
.table-empty p { font-size: 14px; }.table-empty span { font-size: 12px; }
.table-error { color: var(--color-warn); font-size: 13px; padding-bottom: 18px; }
.table-scroll { overflow: auto; border: 1px solid var(--color-line); border-radius: 8px; }
.table-scroll table { width: 100%; border-collapse: collapse; font-size: 13px; }.table-scroll th, .table-scroll td { text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--color-line); white-space: pre-wrap; min-width: 100px; }.table-scroll th { background: var(--color-line-soft); font-weight: 500; }
@media (max-width: 767px) {
  .docs-workspace { height: calc(100dvh - 120px); min-height: 450px; }
  .reader-toolbar { padding: 10px; gap: 8px; }.reader-external span { display: none; }
  .docs-body { flex-direction: column; }.docs-sidebar { width: 100%; height: 45%; min-height: 180px; border-right: 0; border-bottom: 1px solid var(--color-line); }
  .sidebar-heading, .sidebar-tools .subgroup-title, .local-note { display: none; }.sidebar-search { margin-top: 10px; margin-bottom: 6px; flex-shrink: 0; }
  .sidebar-tools { padding: 3px 12px; }.sidebar-tools small { display: none; }.sidebar-tools .doc-link { padding: 6px 12px; }
  .table-view { padding: 18px; }.table-heading { align-items: flex-start; flex-direction: column; }
}
</style>
