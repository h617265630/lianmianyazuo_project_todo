<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { useTodoAppearance } from '@/composables/useTodoAppearance'
import { useAuthStore } from '@/stores/auth'
import { useTodosStore } from '@/stores/todos'
import type { Todo, TodoStatus } from '@/types'
import { priorityLabels } from '@/stores/todos'
import { useProjectsStore } from '@/stores/projects'
import TodoScheduleFields from '@/components/TodoScheduleFields.vue'
import { schedulePreset, schedulePatch, scheduleLabel, todoRange, type ScheduleDraft } from '@/utils/todoSchedule'
import type { TodoPatch } from '@/api'

const props = defineProps<{
  task: Todo
  canWrite?: boolean
}>()

const { appearance } = useTodoAppearance()
const auth = useAuthStore()
const canEdit = computed(() => !!props.canWrite && !!auth.user && auth.user.id === props.task.userId)

const emit = defineEmits<{
  click: [task: Todo]
  statusChange: [task: Todo, newStatus: TodoStatus]
  update: [task: Todo]
  delete: [task: Todo]
}>()

const priorityColor: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
}

const isEditingTitle = ref(false)
const editTitle = ref('')
const isEditingPriority = ref(false)
const scheduleDialog = ref<HTMLDialogElement | null>(null)
const editSchedule = ref<ScheduleDraft>(schedulePreset())
const scheduleError = ref('')

function startEditTitle(e: Event) {
  if (!canEdit.value) return
  e.stopPropagation()
  editTitle.value = props.task.title
  isEditingTitle.value = true
}

async function saveTitle(e: Event) {
  e.stopPropagation()
  if (!isEditingTitle.value) return
  isEditingTitle.value = false
  const title = editTitle.value.trim()
  if (title && title !== props.task.title) await savePatch({ title })
}

function cancelTitle(e: Event) {
  e.stopPropagation()
  isEditingTitle.value = false
}

function startEditPriority(e: Event) {
  if (!canEdit.value) return
  e.stopPropagation()
  isEditingPriority.value = true
}

async function savePriority(e: Event, val: string) {
  e.stopPropagation()
  isEditingPriority.value = false
  await savePatch({ priority: val as Todo['priority'] })
}

function openSchedule() {
  if (!canEdit.value) return
  const range = todoRange(props.task)
  editSchedule.value = range ? { mode: 'custom', ...range } : schedulePreset()
  scheduleError.value = ''
  updateError.value = ''
  scheduleDialog.value?.showModal()
}
async function saveSchedule() {
  try {
    if (await savePatch(schedulePatch(editSchedule.value))) scheduleDialog.value?.close()
  } catch (error) {
    scheduleError.value = error instanceof Error ? error.message : '请检查时间安排'
  }
}

const projects = useProjectsStore()
const updateError = ref('')
const isSaving = ref(false)
async function savePatch(patch: TodoPatch) {
  if (!canEdit.value || isSaving.value) return false
  isSaving.value = true
  updateError.value = ''
  try {
    emit('update', await todosStore.update(props.task.id, patch))
    return true
  } catch (error) {
    updateError.value = error instanceof Error ? error.message : '保存失败，请重试'
    return false
  } finally {
    isSaving.value = false
  }
}

const deleteDialog = ref<HTMLDialogElement | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')
const todosStore = useTodosStore()
const tomatoRemaining = ref(0)
const tomatoRunning = ref(false)
let tomatoTimer: ReturnType<typeof setInterval> | null = null
const tomatoLabel = computed(() => {
  const m = Math.floor(tomatoRemaining.value / 60).toString().padStart(2, '0')
  const s = (tomatoRemaining.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})
function playTomatoAlarm() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const now = context.currentTime
  ;[0, 0.45, 0.9].forEach(offset => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, now + offset)
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.3)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(now + offset)
    oscillator.stop(now + offset + 0.32)
  })
  window.setTimeout(() => context.close(), 1600)
}
function startTomato() {
  if (!props.task.tomatoMinutes) return
  if (tomatoRunning.value) {
    if (tomatoTimer) clearInterval(tomatoTimer)
    tomatoTimer = null
    tomatoRunning.value = false
    return
  }
  if (tomatoRemaining.value <= 0) tomatoRemaining.value = props.task.tomatoMinutes * 60
  tomatoRunning.value = true
  tomatoTimer = setInterval(() => {
    tomatoRemaining.value--
    if (tomatoRemaining.value <= 0) {
      if (tomatoTimer) clearInterval(tomatoTimer)
      tomatoTimer = null; tomatoRunning.value = false
      playTomatoAlarm()
      window.alert(`番茄待办完成：${props.task.title}`)
    }
  }, 1000)
}
onUnmounted(() => { if (tomatoTimer) clearInterval(tomatoTimer) })

function openDeleteDialog() {
  if (!canEdit.value) return
  deleteError.value = ''
  deleteDialog.value?.showModal()
}

async function confirmDelete() {
  if (!canEdit.value || isDeleting.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await todosStore.remove(props.task.id)
    deleteDialog.value?.close()
    // 删除事件表示数据库已成功删除，父组件只需同步列表。
    emit('delete', props.task)
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : '删除失败，请重试'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div
    class="todo-block group/todo bg-white rounded-lg shadow-sm border border-stone-200 p-3 cursor-pointer hover:shadow-md transition-shadow relative"
    :class="`todo-block--${appearance}`"
    :data-priority="task.priority"
    @click="emit('click', task)"
  >
    <!-- 删除按钮：悬浮卡片时显示 -->
    <button
      v-if="canEdit"
      class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-xs text-stone-400 hover:text-red-500 opacity-0 group-hover/todo:opacity-100 group-focus-within/todo:opacity-100 transition-opacity todo-delete"
      type="button"
      title="删除"
      :aria-label="`删除待办：${task.title}`"
      @click.stop="openDeleteDialog"
    >
      ✕
    </button>

    <div class="flex items-start justify-between gap-2 mb-2"
      :class="{ 'pr-5': canEdit }">
      <!-- 优先级 -->
      <select
        v-if="isEditingPriority"
        class="text-xs border border-stone-200 rounded px-1 py-0.5 bg-white"
        :value="task.priority"
        @change="e => savePriority(e, (e.target as HTMLSelectElement).value)"
        @blur="isEditingPriority = false"
        @click.stop
        autofocus
      >
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <span
        v-else
        class="text-xs px-1.5 py-0.5 rounded font-medium cursor-pointer"
        :class="priorityColor[task.priority || 'medium']"
        :style="{ opacity: canEdit ? 1 : 0.8 }"
        @click="startEditPriority"
        :title="canEdit ? '点击修改优先级' : ''"
      >
        {{ priorityLabels[task.priority || 'medium'] }}
      </span>

      <button type="button" class="text-xs text-stone-400 ml-auto min-w-0 truncate text-right" :disabled="!canEdit" :title="`${scheduleLabel(task)}${canEdit ? ' · 点击修改时间安排' : ''}`" aria-label="修改时间安排" @click.stop="openSchedule">{{ scheduleLabel(task) }}</button>
    </div>

    <!-- 标题 -->
    <input
      v-if="isEditingTitle"
      v-model="editTitle"
      class="text-sm text-stone-800 leading-snug w-full border border-stone-300 rounded px-1 py-0.5 mb-1"
      @blur="saveTitle"
      @keydown.enter="saveTitle"
      @keydown.esc="cancelTitle"
      @click.stop
      autofocus
    >
    <p
      v-else
      class="text-sm text-stone-800 leading-snug"
      :style="{ cursor: canEdit ? 'text' : 'default' }"
      @click="canEdit && startEditTitle($event)"
      :title="canEdit ? '点击修改标题' : ''"
    >
      {{ task.title }}
    </p>

    <p v-if="task.detail" class="text-xs text-stone-400 mt-1 line-clamp-2">
      {{ task.detail }}
    </p>

    <div class="flex items-center gap-2 mt-2">
      <select
        class="text-xs border border-stone-200 rounded px-1 py-0.5 bg-white"
        :value="task.status"
        :disabled="!canEdit || isSaving"
        @change="e => savePatch({ status: (e.target as HTMLSelectElement).value as TodoStatus })"
        @click.stop
      >
        <option value="todo">待办</option>
        <option value="doing">进行中</option>
        <option value="done">已完成</option>
      </select>

      <span
        v-if="task.percentDone"
        class="text-xs text-stone-400"
      >
        {{ task.percentDone }}%
      </span>
      <button v-if="task.tomatoMinutes" type="button" class="ml-auto text-xs rounded px-2 py-1 border border-orange-200 text-orange-700 hover:bg-orange-50" @click.stop="startTomato">{{ tomatoRunning ? tomatoLabel : (tomatoRemaining > 0 ? `${tomatoLabel} · 继续` : '开始番茄') }}</button>
    </div>
    <div class="mt-2" @click.stop>
      <select v-if="canEdit" aria-label="关联项目" :value="task.projectId || ''" :disabled="isSaving" class="w-full text-xs border border-stone-200 rounded px-1 py-1 bg-white" @change="e => savePatch({ projectId: (e.target as HTMLSelectElement).value || null })">
        <option value="">未关联项目</option>
        <option v-if="task.projectId && !projects.byId.has(task.projectId)" :value="task.projectId">当前关联项目</option>
        <option v-for="project in projects.projects" :key="project.id" :value="project.id">{{ project.name }}</option>
      </select>
      <span v-else class="text-xs text-stone-400">{{ task.projectId ? projects.byId.get(task.projectId)?.name || '已关联项目' : '未关联项目' }}</span>
    </div>
    <p v-if="updateError" role="alert" class="mt-2 text-xs text-red-600">{{ updateError }}</p>
    <dialog ref="scheduleDialog" class="schedule-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border p-5 shadow-xl backdrop:bg-black/25" :aria-labelledby="`schedule-title-${task.id}`" @click.stop @cancel="isSaving && $event.preventDefault()">
      <form @submit.prevent="saveSchedule" class="space-y-4">
        <h3 :id="`schedule-title-${task.id}`" class="text-base font-medium">修改时间安排</h3>
        <TodoScheduleFields v-model="editSchedule" :disabled="isSaving" />
        <p v-if="scheduleError || updateError" role="alert" class="text-sm text-red-600">{{ scheduleError || updateError }}</p>
        <div class="flex justify-end gap-3"><button type="button" class="btn-link text-sm" :disabled="isSaving" @click="scheduleDialog?.close()">取消</button><button type="submit" class="btn-cta" :disabled="isSaving">{{ isSaving ? '保存中…' : '保存' }}</button></div>
      </form>
    </dialog>
    <dialog
      ref="deleteDialog"
      class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-stone-200 bg-white p-5 shadow-xl backdrop:bg-black/25"
      :aria-labelledby="`delete-title-${task.id}`"
      :aria-describedby="`delete-description-${task.id}`"
      :aria-busy="isDeleting"
      @click.stop
      @cancel="isDeleting && $event.preventDefault()"
    >
      <h3 :id="`delete-title-${task.id}`" class="text-base font-medium text-stone-800">删除待办？</h3>
      <p :id="`delete-description-${task.id}`" class="mt-2 text-sm text-stone-500 break-words">确定删除「{{ task.title }}」吗？删除后无法恢复。</p>
      <p v-if="deleteError" role="alert" class="mt-3 text-sm text-red-600">{{ deleteError }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" autofocus :disabled="isDeleting" class="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 disabled:opacity-50" @click="deleteDialog?.close()">取消</button>
        <button type="button" :disabled="isDeleting" class="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50" @click="confirmDelete">{{ isDeleting ? '删除中…' : '删除' }}</button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.schedule-dialog { width: min(28rem, calc(100vw - 2rem)); background: var(--panel-bg); color: var(--color-ink); border-color: var(--color-line); }
@media (hover: none) {
  .todo-delete { opacity: 1; }
}
.todo-block--alternate {
  padding: 18px 16px 14px 20px;
  border-radius: 12px;
  border-color: var(--color-line);
  border-left: 3px solid #6c9a83;
  background: var(--panel-bg);
  box-shadow: 0 2px 5px rgb(25 40 30 / 3%);
}
.todo-block--alternate[data-priority='medium'] { border-left-color: #d1a35e; }
.todo-block--alternate[data-priority='high'] { border-left-color: #c57063; }
.todo-block--alternate > p { color: var(--color-ink); }
.todo-block--alternate > p.text-sm { font-size: 14px; font-weight: 550; line-height: 1.7; margin-block: 12px; }
.todo-block--alternate > .mt-2 { padding-top: 9px; border-top: 1px solid var(--color-line-soft); }
.todo-block--alternate select { border-color: var(--color-line); background-color: var(--panel-bg); color: var(--color-ink-soft); }
.todo-block--minimal {
  border: 0;
  border-left: 4px solid var(--color-accent);
  border-radius: 4px;
  background: var(--panel-bg);
  box-shadow: none;
  padding: 14px 16px;
}
.todo-block--minimal:hover { box-shadow: 0 5px 14px rgb(30 40 50 / 8%); }
.todo-block--minimal > p.text-sm { font-size: 13px; letter-spacing: .01em; }
.todo-block--minimal select { border: 0; background: transparent; padding-left: 0; }
.todo-block--midnight {
  color: #e7eef5;
  border-color: #334454;
  border-radius: 10px;
  background: linear-gradient(135deg, #1b2935, #243746);
  box-shadow: 0 8px 20px rgb(16 28 38 / 18%);
}
.todo-block--midnight > p.text-sm { color: #edf4f8; font-weight: 550; }
.todo-block--midnight > p.text-xs { color: #aabcc8; }
.todo-block--midnight select { border-color: #496071; background: #1c2d3a; color: #dce8ef; }
.todo-block--midnight .todo-delete { color: #9eb2bf; }
</style>
