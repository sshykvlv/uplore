/**
 * Relative time helper — "2 days ago", "just now", etc.
 * Accepts a TimeDict so the output is localized.
 */
import type { TimeDict } from '@/lib/i18n/dictionaries'
import { dictionaries } from '@/lib/i18n/dictionaries'

/** English TimeDict as a safe default for contexts that don't pass one. */
const defaultTime: TimeDict = dictionaries.en.time

export function relativeTime(dateStr: string, t: TimeDict = defaultTime): string {
  const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return t.justNow
  if (diffSec < 3600) return t.minutesAgo(Math.floor(diffSec / 60))
  if (diffSec < 86400) return t.hoursAgo(Math.floor(diffSec / 3600))
  if (diffSec < 86400 * 7) return t.daysAgo(Math.floor(diffSec / 86400))
  if (diffSec < 86400 * 30) return t.weeksAgo(Math.floor(diffSec / (86400 * 7)))
  if (diffSec < 86400 * 365) return t.monthsAgo(Math.floor(diffSec / (86400 * 30)))
  return t.yearsAgo(Math.floor(diffSec / (86400 * 365)))
}
