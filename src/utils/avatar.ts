const avatarPalette = [
  ['#dbeafe', '#315b83'],
  ['#e8e4f5', '#625388'],
  ['#f5e6d3', '#8a5c32'],
  ['#dcefe7', '#39705b'],
  ['#f3dfe5', '#8a4e63'],
  ['#e7e5e4', '#57534e'],
] as const

export function defaultAvatar(userId: string, name: string) {
  let hash = 0
  for (const char of userId || name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  let index = hash % avatarPalette.length
  try {
    const saved = localStorage.getItem(`lianmian.avatar.${userId}`)
    if (saved !== null) index = Number(saved) % avatarPalette.length
  } catch { /* optional preference */ }
  const [background, foreground] = avatarPalette[index]
  const label = (name.trim() || '?').slice(0, 1).toUpperCase()
  return { label, background, foreground }
}

export function setAvatarChoice(userId: string, choice: number) {
  try { localStorage.setItem(`lianmian.avatar.${userId}`, String(choice)) } catch { /* optional preference */ }
}

export function getUploadedAvatar(userId: string): string | null {
  try { return localStorage.getItem(`lianmian.avatar-image.${userId}`) } catch { return null }
}

export function setUploadedAvatar(userId: string, dataUrl: string | null) {
  try {
    const key = `lianmian.avatar-image.${userId}`
    if (dataUrl) localStorage.setItem(key, dataUrl)
    else localStorage.removeItem(key)
  } catch { /* optional preference */ }
}
