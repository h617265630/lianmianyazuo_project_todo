import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { api } from '@/api'
import { getToken, setToken } from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())

  // 信任 token 存在即为已登录，user.value 由 restore() 异步填充
  const isAuthenticated = computed(() => !!token.value)

  async function register(input: { email: string; name: string; password: string }) {
    const res = await api.register(input)
    token.value = res.token
    user.value = res.user
    setToken(res.token)
    return res.user
  }

  async function login(input: { email: string; password: string }) {
    const res = await api.login(input)
    token.value = res.token
    user.value = res.user
    setToken(res.token)
    return res.user
  }

  async function restore() {
    if (!token.value) return
    try {
      user.value = await api.me()
    } catch {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    setToken(null)
  }

  return { user, token, isAuthenticated, register, login, restore, logout }
})
