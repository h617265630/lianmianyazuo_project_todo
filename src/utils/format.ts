export function formatDate(d?: string): string {
  if (!d) return '—'
  return d
}

export function relativeDays(target: string, base = new Date()): string {
  if (!target) return ''
  const t = new Date(target).getTime()
  const diff = Math.round((t - base.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff > 0) return `${diff} 天后`
  return `${-diff} 天前`
}

export function copyText(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  return Promise.resolve()
}