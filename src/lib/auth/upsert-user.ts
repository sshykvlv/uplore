import { db } from '@/lib/db'
import type { NormalisedIdentity } from './providers'

interface UpsertResult {
  id: number
}

/**
 * Upsert a user row from a normalised provider identity.
 * Returns the internal user id.
 */
export function upsertUser(provider: string, identity: NormalisedIdentity): number {
  const existing = db
    .prepare('SELECT id FROM users WHERE provider = ? AND provider_id = ?')
    .get(provider, identity.providerId) as UpsertResult | undefined

  if (existing) {
    // Refresh display fields on each login
    db.prepare(
      `UPDATE users SET username = ?, display_name = ?, avatar_url = ? WHERE id = ?`
    ).run(identity.username ?? null, identity.displayName ?? null, identity.avatarUrl ?? null, existing.id)
    return existing.id
  }

  const result = db
    .prepare(
      `INSERT INTO users (provider, provider_id, username, display_name, avatar_url, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      provider,
      identity.providerId,
      identity.username ?? null,
      identity.displayName ?? null,
      identity.avatarUrl ?? null
    )

  return Number(result.lastInsertRowid)
}
