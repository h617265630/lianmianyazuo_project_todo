import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('./pages/Login.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/Home.vue'),
      meta: { title: '概览' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('./pages/Projects.vue'),
      meta: { title: '项目' },
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('./pages/Projects.vue'),
      meta: { title: '项目' },
    },
    {
      path: '/todos',
      name: 'todos',
      component: () => import('./pages/Todos.vue'),
      meta: { title: '待办' },
    },
    {
      path: '/todos/by-date/:date',
      name: 'todos-by-date',
      component: () => import('./pages/TodosByDate.vue'),
      meta: { title: '每日待办' },
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('./pages/DocsHub.vue'),
      meta: { title: '综合资料' },
    },
    {
      path: '/research',
      name: 'research',
      component: () => import('./pages/Research.vue'),
      meta: { title: '研究' },
    },
    {
      path: '/research/new',
      name: 'research-new',
      component: () => import('./pages/ResearchCompose.vue'),
      meta: { title: '写一篇研究' },
    },
    {
      path: '/resources',
      name: 'resources',
      component: () => import('./pages/Resources.vue'),
      meta: { title: '资料库' },
    },
    {
      path: '/user',
      name: 'user-management',
      component: () => import('./pages/UserManagement.vue'),
      meta: { title: '用户管理' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(to => {
  const auth = useAuthStore()
  if (to.name === 'login') {
    if (auth.isAuthenticated) return { name: 'home' }
    return true
  }
  if (!auth.isAuthenticated) return { name: 'login' }
  return true
})

router.afterEach(to => {
  const t = (to.meta.title as string) || ''
  document.title = t ? `${t} · 连绵雅座` : '连绵雅座'
})

router.onError(error => {
  console.error('[router] 页面加载失败', error)
})

export default router
