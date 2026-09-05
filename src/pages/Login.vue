<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const name = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = '请填写邮箱和密码'
    return
  }
  if (mode.value === 'register' && !name.value.trim()) {
    error.value = '请填写昵称'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login({ email: email.value.trim(), password: password.value })
    } else {
      await auth.register({
        email: email.value.trim(),
        name: name.value.trim(),
        password: password.value,
      })
    }
    router.push('/')
  } catch (e) {
    error.value = (e as Error).message || '操作失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function fillUser(name: 'n' | 'v') {
  email.value = `${name}@lianmian.dev`
  password.value = `${name}1234`
  submit()
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center rise">
    <div class="w-full max-w-md">
      <div class="glass frame p-8 md:p-10">
        <div class="text-center space-y-2">
          <span
            class="inline-block w-2 h-2 rounded-full"
            style="background-color: var(--color-accent); box-shadow: 0 0 10px var(--color-accent)"
          />
          <h1 class="text-3xl font-medium tracking-tight" style="letter-spacing: -0.03em">
            连绵雅座
          </h1>
          <p class="text-sm" style="color: var(--color-ink-soft)">
            把散落的项目、待办、资料与研究收进一处。
          </p>
        </div>

        <div class="mt-8 flex items-baseline gap-5">
          <button
            v-for="o in [
              { value: 'login', label: '登录' },
              { value: 'register', label: '注册' },
            ]"
            :key="o.value"
            @click="mode = o.value as any; error = ''"
            class="chip"
            :class="{ 'is-active': mode === o.value }"
          >
            {{ o.label }}
          </button>
        </div>

        <form class="mt-6 space-y-6" @submit.prevent="submit">
          <div v-if="mode === 'register'">
            <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">昵称</label>
            <input
              v-model="name"
              class="input-line mt-2"
              placeholder="怎么称呼你"
              autocomplete="nickname"
            />
          </div>
          <div>
            <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">邮箱</label>
            <input
              v-model="email"
              type="email"
              class="input-line mt-2"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>
          <div>
            <label class="text-xs tracking-widest uppercase" style="color: var(--color-mute)">密码</label>
            <input
              v-model="password"
              type="password"
              class="input-line mt-2"
              placeholder="至少 6 位"
              autocomplete="current-password"
            />
          </div>

          <p v-if="error" class="text-sm" style="color: var(--color-warn)">{{ error }}</p>

          <button type="submit" class="btn-cta w-full" :disabled="loading">
            {{ loading ? '处理中…' : mode === 'login' ? '登录' : '创建账号' }}
          </button>
        </form>

        <div v-if="mode === 'login'" class="mt-6 flex justify-center gap-3">
          <button type="button" class="btn-cta flex-1" @click="fillUser('n')">登录 n</button>
          <button type="button" class="btn-cta flex-1" @click="fillUser('v')">登录 v</button>
        </div>
      </div>
    </div>
  </div>
</template>
