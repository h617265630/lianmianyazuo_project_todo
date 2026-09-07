import { ref } from 'vue'
export type TodoAppearance = 'original' | 'alternate'
function initial(): TodoAppearance {
  try { return localStorage.getItem('lianmian.todo-appearance') === 'alternate' ? 'alternate' : 'original' }
  catch { return 'original' }
}
const appearance = ref<TodoAppearance>(initial())
export function useTodoAppearance() {
  return { appearance, setAppearance(value: TodoAppearance) {
    appearance.value = value
    try { localStorage.setItem('lianmian.todo-appearance', value) } catch { /* optional preference */ }
  } }
}
