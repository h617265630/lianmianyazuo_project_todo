import { ref } from 'vue'
export type TodoAppearance = 'original' | 'alternate' | 'minimal' | 'midnight'
function initial(): TodoAppearance {
  try {
    const saved = localStorage.getItem('lianmian.todo-appearance')
    return saved === 'alternate' || saved === 'minimal' || saved === 'midnight' ? saved : 'original'
  }
  catch { return 'original' }
}
const appearance = ref<TodoAppearance>(initial())
export function useTodoAppearance() {
  return { appearance, setAppearance(value: TodoAppearance) {
    appearance.value = value
    try { localStorage.setItem('lianmian.todo-appearance', value) } catch { /* optional preference */ }
  } }
}
