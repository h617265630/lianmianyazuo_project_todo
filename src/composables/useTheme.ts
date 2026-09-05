import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lianmian.theme'

function readInitial(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'light'
}

const theme = ref<Theme>(readInitial())

function apply(t: Theme) {
  theme.value = t
  document.documentElement.setAttribute('data-theme', t)
  try {
    localStorage.setItem(STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', t === 'dark' ? '#0b0f17' : '#f8fafc')
}

/** Sync DOM with the persisted theme before the app mounts (no flash). */
export function initTheme() {
  apply(theme.value)
}

export function useTheme() {
  return {
    theme,
    set: (t: Theme) => apply(t),
    toggle: () => apply(theme.value === 'light' ? 'dark' : 'light'),
  }
}
