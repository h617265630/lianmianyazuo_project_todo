import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initTheme } from './composables/useTheme'
import { useAuthStore } from './stores/auth'
import { useProjectsStore } from './stores/projects'
import { useTodosStore } from './stores/todos'
import { useResourcesStore } from './stores/resources'
import { useResearchStore } from './stores/research'
import { useInsightsStore } from './stores/insights'
import './style.css'

initTheme()

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

async function bootstrap() {
  const auth = useAuthStore(pinia)
  await auth.restore()
  if (auth.isAuthenticated) {
    const projects = useProjectsStore(pinia)
    const todos = useTodosStore(pinia)
    const resources = useResourcesStore(pinia)
    const research = useResearchStore(pinia)
    const insights = useInsightsStore(pinia)
    await Promise.all([
      projects.load(),
      todos.load(),
      resources.load(),
      research.load(),
      insights.load(),
    ])
  }
  app.mount('#app')
}

bootstrap()
