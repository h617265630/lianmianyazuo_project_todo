import { ref } from 'vue'

export type ContentWidth = 'default' | 'wide80' | 'full'
const KEY = 'lianmian.content-width'
function initial(): ContentWidth {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'full' || saved === 'wide80' ? saved : 'default'
  } catch { return 'default' }
}
const contentWidth = ref<ContentWidth>(initial())
export function useContentWidth() {
  function setContentWidth(value: ContentWidth) {
    contentWidth.value = value
    try { localStorage.setItem(KEY, value) } catch { /* optional preference */ }
  }
  return { contentWidth, setContentWidth }
}
