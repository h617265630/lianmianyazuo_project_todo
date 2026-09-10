<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useResearchStore, stageLabels } from '@/stores/research'
import { useProjectsStore } from '@/stores/projects'
import type { ResearchStage } from '@/types'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const router = useRouter()
const research = useResearchStore()
const projects = useProjectsStore()
const title = ref('')
const teaser = ref('')
const body = ref('')
const tags = ref('')
const stage = ref<ResearchStage>('seedling')
const projectIds = ref<string[]>([])
const saving = ref(false)
const error = ref('')
const titleInput = ref<HTMLTextAreaElement>()
const tagList = computed(() => tags.value.split(/[,，]/).map(x => x.trim()).filter(Boolean))
function resizeTitle() {
  const el = titleInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
onMounted(() => nextTick(resizeTitle))

function toggleProject(id: string) {
  projectIds.value = projectIds.value.includes(id) ? projectIds.value.filter(x => x !== id) : [...projectIds.value, id]
}

async function save() {
  if (!title.value.trim() || saving.value) return
  saving.value = true
  error.value = ''
  try {
    const note = await research.add({ title: title.value.trim(), teaser: teaser.value.trim(), body: body.value.trim(), tags: tagList.value, stage: stage.value, projectIds: projectIds.value })
    await router.push({ path: '/research', query: { note: note.id } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '保存失败，请重试'
  } finally { saving.value = false }
}
</script>

<template>
  <div class="research-editor rise">
    <header class="editor-top">
      <RouterLink to="/research" class="back-link">← 研究库</RouterLink>
      <div class="editor-actions"><span v-if="error" class="editor-error">{{ error }}</span><button class="btn-link" @click="router.push('/research')">取消</button><button class="btn-cta" :disabled="!title.trim() || saving" @click="save">{{ saving ? '保存中…' : '发布研究' }}</button></div>
    </header>
    <div class="editor-layout">
      <main class="editor-paper">
        <p class="eyebrow">NEW RESEARCH · {{ stageLabels[stage] }}</p>
        <textarea ref="titleInput" v-model="title" class="doc-title" rows="2" autofocus placeholder="给这篇研究一个标题" @input="resizeTitle" />
        <input v-model="teaser" class="doc-teaser" placeholder="用一句话说清楚：这篇研究想回答什么？" />
        <div class="doc-rule" />
        <MdEditor v-model="body" language="zh-CN" theme="light" preview-theme="github" :toolbars-exclude="['github']" class="markdown-editor" />
      </main>
      <aside class="editor-meta">
        <p class="eyebrow">DOCUMENT SETTINGS</p>
        <label>研究阶段<select v-model="stage" class="input-line"><option v-for="(label, key) in stageLabels" :key="key" :value="key">{{ label }}</option></select></label>
        <label>关联项目<div class="meta-chips"><button v-for="project in projects.projects" :key="project.id" class="chip" :class="{ 'is-active': projectIds.includes(project.id) }" type="button" @click="toggleProject(project.id)">{{ project.name }}</button><span v-if="!projects.projects.length" class="meta-muted">暂无项目</span></div></label>
        <label>标签<input v-model="tags" class="input-line" placeholder="ESP32, 低功耗" /><span class="meta-hint">用逗号分隔</span></label>
        <div class="editor-note"><strong>写作提示</strong><p>先写事实，再写你的判断。正文支持长文，保存后会回到研究库。</p></div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.research-editor { min-height: calc(100vh - 150px); }
.editor-top { display:flex; align-items:center; justify-content:space-between; gap:20px; padding-bottom:20px; border-bottom:1px solid var(--color-line); }
.back-link { color:var(--color-mute); font-size:13px; text-decoration:none; }.back-link:hover { color:var(--color-ink); }
.editor-actions { display:flex; align-items:center; gap:18px; }.editor-error { color:var(--color-warn); font-size:12px; max-width:260px; }
.editor-layout { display:grid; grid-template-columns:minmax(0, 1fr) 240px; gap:80px; width:80%; max-width:none; margin:0 auto; padding:65px 0 100px; }
.editor-paper { min-width:0; }.eyebrow { color:var(--color-mute); font-size:10px; letter-spacing:.14em; }
.doc-title,.doc-teaser,.doc-body { display:block; width:100%; border:0; outline:0; background:transparent; color:var(--color-ink); }.doc-title { margin-top:22px; min-height:96px; resize:none; overflow:hidden; font-size:clamp(30px,4vw,44px); line-height:1.25; letter-spacing:-.035em; font-weight:500; }.doc-teaser { margin-top:20px; font-size:19px; line-height:1.6; color:var(--color-ink-soft); }.doc-rule { margin:34px 0 25px; border-top:1px solid var(--color-line); }.doc-body { min-height:520px; resize:vertical; font-size:16px; line-height:2; color:var(--color-ink-soft); }.doc-title::placeholder,.doc-teaser::placeholder,.doc-body::placeholder { color:var(--color-mute); opacity:.7; }
.markdown-editor { height:900px; margin-top:4px; border:1px solid var(--color-line); border-radius:10px; overflow:hidden; box-shadow:0 8px 28px rgb(35 51 75 / 4%); }
.markdown-editor :deep(.md-editor) { height:100%; }
.markdown-editor :deep(.md-editor-content) { height:calc(100% - 48px); min-height:0; }
.markdown-editor :deep(.md-editor-input-wrapper),.markdown-editor :deep(.md-editor-preview-wrapper) { padding:22px 24px; }
.markdown-editor :deep(.md-editor-toolbar) { border-bottom-color:var(--color-line); background:var(--color-line-soft); }
.editor-meta { border-left:1px solid var(--color-line); padding-left:24px; }.editor-meta label { display:block; margin-top:28px; color:var(--color-ink-soft); font-size:12px; }.editor-meta select,.editor-meta input { margin-top:8px; }.meta-chips { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }.meta-muted,.meta-hint { display:block; color:var(--color-mute); font-size:11px; margin-top:7px; }.editor-note { margin-top:45px; padding-top:15px; border-top:1px solid var(--color-line); color:var(--color-mute); font-size:11px; line-height:1.7; }.editor-note strong { color:var(--color-ink-soft); font-size:12px; }
@media (max-width: 800px) { .editor-top { align-items:flex-start; }.editor-actions { gap:10px; }.editor-error { display:none; }.editor-layout { display:block; padding:40px 0 70px; }.editor-meta { border-left:0; border-top:1px solid var(--color-line); margin-top:45px; padding:25px 0 0; }.doc-body { min-height:420px; }.doc-title { font-size:32px; min-height:84px; }.markdown-editor { height:760px; }.markdown-editor :deep(.md-editor-input-wrapper),.markdown-editor :deep(.md-editor-preview-wrapper) { padding:16px; } }
</style>
