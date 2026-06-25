import { db } from '@/lib/db'
import type { NormalisedIdentity } from './providers'

interface UpsertResult {
  id: number
}

/**
 * Upsert a user row from a normalised provider identity.
 * Returns the internal user id.
 *
 * avatar_url is intentionally NOT written here — it is set immediately after
 * by setUserAvatar() once the photo has been downloaded locally.  This avoids
 * ever persisting a raw t.me hotlink that would expire.
 */
export function upsertUser(provider: string, identity: NormalisedIdentity): number {
  const existing = db
    .prepare('SELECT id FROM users WHERE provider = ? AND provider_id = ?')
    .get(provider, identity.providerId) as UpsertResult | undefined

  if (existing) {
    // Refresh display fields on each login; avatar is handled by setUserAvatar
    db.prepare(
      `UPDATE users SET username = ?, display_name = ? WHERE id = ?`
    ).run(identity.username ?? null, identity.displayName ?? null, existing.id)
    return existing.id
  }

  const result = db
    .prepare(
      `INSERT INTO users (provider, provider_id, username, display_name, avatar_url, created_at)
       VALUES (?, ?, ?, ?, NULL, datetime('now'))`
    )
    .run(
      provider,
      identity.providerId,
      identity.username ?? null,
      identity.displayName ?? null,
    )

  return Number(result.lastInsertRowid)
}

/**
 * Overwrite avatar_url for an existing user row.
 * Called after storeTelegramAvatar() resolves with a local /api/uploads/ path.
 * Passing null is valid — it clears a previously stored avatar.
 */
export function setUserAvatar(userId: number, avatarUrl: string | null): void {
  db.prepare(`UPDATE users SET avatar_url = ? WHERE id = ?`).run(avatarUrl, userId)
}
