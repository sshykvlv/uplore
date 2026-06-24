/**
 * Telegram Login Widget auth provider.
 *
 * Telegram's documented verification algorithm:
 *   1. Collect all fields (except `hash`) as "key=value" lines, sorted lexicographically.
 *   2. Join with "\n".
 *   3. Use HMAC-SHA256 with key = SHA256(bot_token) — NOT the raw token.
 *   4. Compare result with the `hash` field (hex).
 *
 * Reference: https://core.telegram.org/widgets/login#checking-authorization
 */

import crypto from 'crypto'
import type { AuthProvider, NormalisedIdentity } from './providers'

export const telegramProvider: AuthProvider = {
  id: 'telegram',

  async verify(payload: Record<string, string>): Promise<NormalisedIdentity> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN not configured')

    const { hash, ...fields } = payload
    if (!hash) throw new Error('Missing hash in Telegram callback')

    // auth_date freshness check — reject if older than 24h
    const authDate = parseInt(fields.auth_date ?? '0', 10)
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) throw new Error('Telegram auth data expired')

    // Build the check string
    const checkString = Object.entries(fields)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    // Key = SHA256(bot_token)
    const secretKey = crypto.createHash('sha256').update(botToken).digest()
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex')

    if (
      expectedHash.length !== hash.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(hash, 'hex'))
    ) {
      throw new Error('Invalid Telegram auth hash')
    }

    return {
      providerId: fields.id,
      username: fields.username,
      displayName: [fields.first_name, fields.last_name].filter(Boolean).join(' ') || undefined,
      avatarUrl: fields.photo_url,
    }
  },
}
