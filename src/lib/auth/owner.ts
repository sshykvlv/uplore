import { db } from '@/lib/db'

/**
 * Whether the given user is the site owner — the only account allowed to
 * archive ideas. Configured via OWNER_TELEGRAM_ID (that user's provider_id).
 * Unset by default, so the archive feature is off for self-hosters.
 */
export function isOwner(userId: number | null): boolean {
  const ownerId = process.env.OWNER_TELEGRAM_ID
  if (!userId || !ownerId) return false

  const user = db.prepare('SELECT provider_id FROM users WHERE id = ?').get(userId) as
    | { provider_id: string }
    | undefined

  return user?.provider_id === ownerId
}
