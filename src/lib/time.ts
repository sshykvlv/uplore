/**
 * Relative time helper — "2 days ago", "just now", etc.
 */
export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60)
    return `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  if (diffSec < 86400 * 7) {
    const d = Math.floor(diffSec / 86400)
    return `${d} day${d === 1 ? '' : 's'} ago`
  }
  if (diffSec < 86400 * 30) {
    const w = Math.floor(diffSec / (86400 * 7))
    return `${w} week${w === 1 ? '' : 's'} ago`
  }
  if (diffSec < 86400 * 365) {
    const mo = Math.floor(diffSec / (86400 * 30))
    return `${mo} month${mo === 1 ? '' : 's'} ago`
  }
  const y = Math.floor(diffSec / (86400 * 365))
  return `${y} year${y === 1 ? '' : 's'} ago`
}
