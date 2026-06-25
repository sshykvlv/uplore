/** Telegram-style label: prefer the @username handle, fall back to display name. */
export function authorLabel(username: string | null, displayName: string | null): string {
  const handle = username?.trim()
  if (handle) return handle.startsWith('@') ? handle : `@${handle}`
  const name = displayName?.trim()
  if (name) return name.startsWith('@') ? name : `@${name}`
  return '@unknown'
}
