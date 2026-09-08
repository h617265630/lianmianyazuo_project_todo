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
  const [background, foreground] = avatarPalette[hash % avatarPalette.length]
  const label = (name.trim() || '?').slice(0, 1).toUpperCase()
  return { label, background, foreground }
}
