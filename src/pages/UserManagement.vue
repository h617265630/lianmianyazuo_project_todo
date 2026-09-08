<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTodosStore } from '@/stores/todos'
import { useProjectsStore } from '@/stores/projects'
import { useResourcesStore, kindLabels } from '@/stores/resources'
import { defaultAvatar, getUploadedAvatar, setAvatarChoice, setUploadedAvatar } from '@/utils/avatar'
import { localDate, overlapsRange } from '@/utils/todoSchedule'
import { useTheme } from '@/composables/useTheme'
import { useTodoAppearance } from '@/composables/useTodoAppearance'
import { useContentWidth } from '@/composables/useContentWidth'

const auth = useAuthStore()
const todos = useTodosStore()
const projects = useProjectsStore()
const resources = useResourcesStore()
const tab = ref<'todos' | 'projects' | 'resources' | 'settings' | 'profile'>('todos')
const { theme, set: setTheme } = useTheme()
const { appearance, setAppearance } = useTodoAppearance()
const { contentWidth, setContentWidth } = useContentWidth()
const profile = ref({ name: '', email: '' })
const profileMessage = ref('')
const profileError = ref('')
const avatarChoice = ref(0)
const uploadedAvatar = ref<string | null>(null)
const avatarChoices = [0, 1, 2, 3, 4, 5]
const todoFilter = ref<'all' | 'today'>('all')
const avatar = computed(() => auth.user ? defaultAvatar(auth.user.id, auth.user.name) : null)

onMounted(() => { if (auth.user) { profile.value = { name: auth.user.name, email: auth.user.email }; avatarChoice.value = Number(localStorage.getItem(`lianmian.avatar.${auth.user.id}`) ?? 0); uploadedAvatar.value = getUploadedAvatar(auth.user.id) } return Promise.all([todos.load(), projects.load(), resources.load()]) })
const visibleTodos = computed(() => todoFilter.value === 'today' ? todos.todos.filter(t => overlapsRange(t, localDate(), localDate())) : todos.todos)
const openTodos = computed(() => visibleTodos.value.filter(t => t.status !== 'done'))
const doneTodos = computed(() => todos.todos.filter(t => t.status === 'done'))
const groupedResources = computed(() => {
  const groups = new Map<string, typeof resources.items>()
  resources.items.forEach(resource => {
    if (!groups.has(resource.kind)) groups.set(resource.kind, [])
    groups.get(resource.kind)!.push(resource)
  })
  return Array.from(groups.entries()).map(([kind, items]) => ({ kind, label: kindLabels[kind as keyof typeof kindLabels], items }))
})

async function removeTodo(id: string) { await todos.remove(id) }
async function removeResource(id: string) { await resources.remove(id) }
async function saveProfile() {
  profileError.value = ''; profileMessage.value = ''
  try { await auth.updateProfile(profile.value); if (auth.user) setAvatarChoice(auth.user.id, avatarChoice.value); profileMessage.value = '用户信息已保存' }
  catch (e) { profileError.value = e instanceof Error ? e.message : '保存失败' }
}
function chooseAvatar(choice: number) { avatarChoice.value = choice; if (auth.user) { setAvatarChoice(auth.user.id, choice); window.dispatchEvent(new Event('avatar-changed')) } }
function uploadAvatar(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  if (file.size > 2 * 1024 * 1024) { profileError.value = '头像图片不能超过 2MB'; return }
  const reader = new FileReader()
  reader.onload = () => { uploadedAvatar.value = String(reader.result); if (auth.user) setUploadedAvatar(auth.user.id, uploadedAvatar.value); window.dispatchEvent(new Event('avatar-changed')) }
  reader.readAsDataURL(file)
}
function clearUploadedAvatar() { uploadedAvatar.value = null; if (auth.user) setUploadedAvatar(auth.user.id, null); window.dispatchEvent(new Event('avatar-changed')) }
</script>

<template>
  <div class="grid lg:grid-cols-[15rem_1fr] gap-8 items-start">
    <aside class="glass p-5 lg:sticky lg:top-24">
      <div class="flex items-center gap-3 pb-5 mb-5 border-b" style="border-color: var(--color-line)">
        <span class="user-avatar" :style="{ backgroundColor: avatar?.background, color: avatar?.foreground }">{{ avatar?.label }}</span>
        <div class="min-w-0"><p class="font-medium truncate">{{ auth.user?.name }}</p><p class="text-xs truncate" style="color: var(--color-mute)">{{ auth.user?.email }}</p></div>
      </div>
      <nav class="space-y-1" aria-label="用户管理分类">
        <button class="user-nav-item w-full text-left px-3 py-2 rounded-lg text-sm" :class="{ active: tab === 'todos' }" @click="tab = 'todos'">我的待办 <span class="float-right opacity-60">{{ todos.todos.length }}</span></button>
        <button class="user-nav-item w-full text-left px-3 py-2 rounded-lg text-sm" :class="{ active: tab === 'projects' }" @click="tab = 'projects'">我的项目 <span class="float-right opacity-60">{{ projects.projects.length }}</span></button>
        <button class="user-nav-item w-full text-left px-3 py-2 rounded-lg text-sm" :class="{ active: tab === 'resources' }" @click="tab = 'resources'">我的资源 <span class="float-right opacity-60">{{ resources.items.length }}</span></button>
        <button class="user-nav-item w-full text-left px-3 py-2 rounded-lg text-sm" :class="{ active: tab === 'settings' }" @click="tab = 'settings'">设定</button>
        <button class="user-nav-item w-full text-left px-3 py-2 rounded-lg text-sm" :class="{ active: tab === 'profile' }" @click="tab = 'profile'">用户信息</button>
      </nav>
    </aside>

    <main class="space-y-6 min-w-0">
      <header><p class="eyebrow">ACCOUNT</p><h1 class="mt-2 text-3xl font-medium">用户管理</h1><p class="mt-2 text-sm" style="color: var(--color-mute)">管理当前账号下的待办、项目与资源。</p></header>

      <section v-if="tab === 'profile'" class="glass p-5 sm:p-6">
        <div class="section-heading"><div><p class="eyebrow">PROFILE</p><h2>用户信息</h2></div></div>
        <form class="max-w-xl space-y-6" @submit.prevent="saveProfile">
          <div><p class="text-sm font-medium mb-3">选择头像</p><div class="flex flex-wrap items-center gap-3"><button v-for="choice in avatarChoices" :key="choice" type="button" class="user-avatar avatar-choice" :class="{ selected: !uploadedAvatar && avatarChoice === choice }" :style="{ backgroundColor: defaultAvatar(`choice-${choice}`, auth.user?.name ?? '').background, color: defaultAvatar(`choice-${choice}`, auth.user?.name ?? '').foreground }" @click="chooseAvatar(choice)">{{ auth.user?.name?.slice(0, 1).toUpperCase() }}</button><div v-if="uploadedAvatar" class="user-avatar avatar-choice selected" :style="{ backgroundImage: `url(${uploadedAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div><label class="btn-link text-xs cursor-pointer">上传图片<input type="file" accept="image/*" class="sr-only" @change="uploadAvatar" /></label><button v-if="uploadedAvatar" type="button" class="btn-link text-xs" @click="clearUploadedAvatar">移除图片</button></div><p class="text-xs mt-2" style="color: var(--color-mute)">支持 JPG、PNG 等图片，最大 2MB</p></div>
          <label class="block text-sm">昵称<input v-model="profile.name" required class="input-line mt-2 w-full" /></label>
          <label class="block text-sm">邮箱<input v-model="profile.email" type="email" required class="input-line mt-2 w-full" /></label>
          <p v-if="profileMessage" class="text-sm text-emerald-600">{{ profileMessage }}</p><p v-if="profileError" class="text-sm text-red-600">{{ profileError }}</p>
          <button class="btn-cta" type="submit">保存用户信息</button>
        </form>
      </section>
      <section v-else-if="tab === 'todos'" class="glass p-5 sm:p-6">
        <div class="section-heading"><div><p class="eyebrow">TODOS</p><h2>我的待办</h2></div><span class="text-xs" style="color: var(--color-mute)">{{ openTodos.length }} 进行中 · {{ doneTodos.length }} 已完成</span></div>
        <div class="workspace-tabs mb-3" role="tablist" aria-label="待办分类"><button :class="{ active: todoFilter === 'all' }" @click="todoFilter = 'all'">所有待办</button><button :class="{ active: todoFilter === 'today' }" @click="todoFilter = 'today'">今日待办</button></div>
        <div v-for="t in visibleTodos" :key="t.id" class="flex items-center gap-3 py-3 border-b" style="border-color: var(--color-line)"><span class="w-2 h-2 rounded-full" :class="t.status === 'done' ? 'bg-emerald-500' : 'bg-amber-400'"></span><span class="flex-1 text-sm" :class="{ 'line-through opacity-50': t.status === 'done' }">{{ t.title }}</span><span class="text-xs" style="color: var(--color-mute)">{{ t.projectId ? projects.byId.get(t.projectId)?.name : '无项目' }}</span><button class="text-xs text-red-500" @click="removeTodo(t.id)">删除</button></div>
        <p v-if="!visibleTodos.length" class="empty-panel mt-4">暂无{{ todoFilter === 'today' ? '今日' : '' }}待办</p>
      </section>

      <section v-else-if="tab === 'projects'" class="glass p-5 sm:p-6">
        <div class="section-heading"><div><p class="eyebrow">PROJECTS</p><h2>我的项目</h2></div><RouterLink to="/projects" class="btn-link text-xs">项目页 ↗</RouterLink></div>
        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <RouterLink v-for="p in projects.projects" :key="p.id" :to="`/projects/${p.id}`" class="user-project-card glass p-4">
            <div class="flex items-start justify-between gap-3"><h3 class="font-medium truncate">{{ p.name }}</h3><span class="text-xs shrink-0" style="color: var(--color-mute)">{{ p.progress }}%</span></div>
            <p class="text-xs leading-5 line-clamp-2 mt-3 min-h-10" style="color: var(--color-mute)">{{ p.tagline || '暂无项目简介' }}</p>
            <div class="mt-4 h-1.5 rounded-full overflow-hidden" style="background: var(--color-line)"><div class="h-full rounded-full" style="background: var(--color-accent)" :style="{ width: `${p.progress}%` }"></div></div>
            <p class="text-xs mt-3" style="color: var(--color-mute)">{{ p.status === 'in-progress' ? '进行中' : p.status === 'completed' ? '已完成' : p.status === 'blocked' ? '受阻' : p.status === 'archived' ? '已归档' : '规划中' }} · 查看详情 →</p>
          </RouterLink>
        </div>
        <p v-if="!projects.projects.length" class="empty-panel mt-4">暂无项目</p>
      </section>

      <section v-else-if="tab === 'resources'" class="glass p-5 sm:p-6">
        <div class="section-heading"><div><p class="eyebrow">LIBRARY</p><h2>我的资源</h2></div><RouterLink to="/resources" class="btn-link text-xs">资料库 ↗</RouterLink></div>
        <div v-for="group in groupedResources" :key="group.kind" class="mb-7 last:mb-0">
          <div class="flex items-baseline justify-between mb-2"><h3 class="text-sm font-medium">{{ group.label }}</h3><span class="text-xs" style="color: var(--color-mute)">{{ group.items.length }} 条</span></div>
          <div v-for="r in group.items" :key="r.id" class="flex items-center gap-3 py-4 border-b" style="border-color: var(--color-line)"><div class="flex-1 min-w-0"><a v-if="r.url" :href="r.url" target="_blank" class="font-medium truncate block">{{ r.title }}</a><p v-else class="font-medium truncate">{{ r.title }}</p><p class="text-xs mt-1" style="color: var(--color-mute)">{{ r.projectId ? projects.byId.get(r.projectId)?.name : '通用资源' }}</p></div><button class="text-xs text-red-500" @click="removeResource(r.id)">删除</button></div>
        </div>
        <p v-if="!groupedResources.length" class="empty-panel mt-4">暂无资源</p>
      </section>
      <section v-else class="glass p-5 sm:p-6">
        <div class="section-heading"><div><p class="eyebrow">SETTINGS</p><h2>设定</h2></div></div>
        <div class="space-y-5 max-w-xl">
          <label class="flex items-center justify-between gap-6 py-3 border-b text-sm" style="border-color: var(--color-line)"><span><strong class="font-medium block">主题</strong><small style="color: var(--color-mute)">切换浅色或深色界面</small></span><select class="input-line w-28" :value="theme" @change="setTheme(($event.target as HTMLSelectElement).value as 'light' | 'dark')"><option value="light">浅色</option><option value="dark">深色</option></select></label>
          <label class="flex items-center justify-between gap-6 py-3 border-b text-sm" style="border-color: var(--color-line)"><span><strong class="font-medium block">待办样式</strong><small style="color: var(--color-mute)">选择待办卡片的展示样式</small></span><select class="input-line w-28" :value="appearance" @change="setAppearance(($event.target as HTMLSelectElement).value as 'original' | 'alternate' | 'minimal' | 'midnight')"><option value="original">原版</option><option value="alternate">备用版</option><option value="minimal">极简版</option><option value="midnight">夜幕版</option></select></label>
          <label class="flex items-center justify-between gap-6 py-3 border-b text-sm" style="border-color: var(--color-line)"><span><strong class="font-medium block">内容区域大小</strong><small style="color: var(--color-mute)">调整页面主体内容的显示宽度</small></span><select class="input-line w-28" :value="contentWidth" @change="setContentWidth(($event.target as HTMLSelectElement).value as 'default' | 'wide80' | 'full')"><option value="default">当前大小</option><option value="wide80">80% 宽度</option><option value="full">全屏展示</option></select></label>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.user-nav-item {
  color: var(--color-ink-soft);
  transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
}
.user-nav-item:hover,
.user-nav-item:focus-visible {
  color: var(--color-ink);
  background: var(--color-accent-soft);
  outline: none;
  transform: translateX(2px);
}
.user-nav-item.active {
  color: var(--color-ink);
  background: var(--color-accent-soft);
  box-shadow: inset 3px 0 0 var(--color-accent);
}
.user-project-card { transition: transform 150ms ease, box-shadow 150ms ease; }
.user-project-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px color-mix(in srgb, var(--color-ink) 10%, transparent); }
.avatar-choice { border: 2px solid transparent; cursor: pointer; }
.avatar-choice.selected { border-color: var(--color-accent); box-shadow: 0 0 0 2px var(--color-accent-soft); }
</style>
