/**
 * storeTelegramAvatar
 *
 * Downloads a Telegram widget photo_url server-side and writes it to the local
 * uploads directory so it is served from /api/uploads/ instead of a t.me
 * hotlink that expires after a short time.
 *
 * Design decisions:
 *  - SSRF guard runs before any network I/O even though the photo_url is
 *    HMAC-verified — defense in depth; a compromised/malicious Telegram server
 *    or mis-configured allowlist should not be able to pivot to internal hosts.
 *  - redirect: 'error' — following redirects is a classic SSRF vector even
 *    when the initial destination passes the allowlist check.
 *  - Body is capped at 2 MB regardless of Content-Length (a server can lie).
 *  - Any failure path returns null; callers must never fail a login over this.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Match the exact constant used by the uploads route and ideas route.
const UPLOADS_PATH = process.env.UPLOADS_PATH ?? './uploads'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB hard cap

/**
 * Telegram CDN host allowlist.
 * Exact suffix match on the hostname — never substring (e.g. "evil-t.me" must
 * not match by containing ".me").  We check:
 *   - host === "t.me"
 *   - host ends with ".telegram.org"     (includes cdn.telegram.org, etc.)
 *   - host ends with ".cdn-telegram.org"
 *   - host === "telegram-cdn.org"
 *   - host ends with ".telegram-cdn.org"
 */
function isTelegramHost(host: string): boolean {
  const h = host.toLowerCase()
  return (
    h === 't.me' ||
    h === 'telegram.org' ||
    h.endsWith('.telegram.org') ||
    h === 'cdn-telegram.org' ||
    h.endsWith('.cdn-telegram.org') ||
    h === 'telegram-cdn.org' ||
    h.endsWith('.telegram-cdn.org')
  )
}

/**
 * Download `photoUrl`, write it to UPLOADS_PATH as `avatar-tg-{userId}.jpg`,
 * and return the local `/api/uploads/` serving path with a cache-bust param.
 *
 * @param userId   Internal DB user id — used as the stable filename component.
 * @param photoUrl Raw photo_url from the Telegram widget payload (HMAC-trusted
 *                 but still SSRF-guarded here for defense in depth).
 * @param version  Optional stable cache-bust value (e.g. auth_date from the
 *                 widget payload).  Included as `?v=` in the returned URL.
 *                 Defaults to the written file's byte length if omitted so the
 *                 helper stays deterministic/testable without relying on
 *                 Date.now() internally.
 * @returns Local serving path like `/api/uploads/avatar-tg-9.jpg?v=12345`,
 *          or null if the photo could not be fetched/stored for any reason.
 */
export async function storeTelegramAvatar(
  userId: number,
  photoUrl: string | null | undefined,
  version?: string | number,
): Promise<string | null> {
  if (!photoUrl) return null

  try {
    // --- SSRF guard ---
    let parsed: URL
    try {
      parsed = new URL(photoUrl)
    } catch {
      // Unparseable URL — reject silently
      return null
    }

    if (parsed.protocol !== 'https:') return null
    if (!isTelegramHost(parsed.hostname)) return null

    // --- Fetch with timeout and no redirects ---
    // The single AbortController timeout spans BOTH the header fetch AND the
    // body read — a slow-loris body (or one with a missing/false Content-Length)
    // must not hang the login flow. clearTimeout only fires once the body is
    // fully consumed (or we bail), in the finally below.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)

    try {
      const res = await fetch(photoUrl, {
        redirect: 'error', // refuse any 3xx — prevents redirect-to-internal SSRF
        signal: controller.signal,
      })

      if (!res.ok) return null

      // Require an image content-type
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.startsWith('image/')) return null

      // Fast-reject if the (honest) Content-Length already exceeds the cap.
      const clHeader = Number(res.headers.get('content-length') ?? '0')
      if (clHeader > MAX_AVATAR_BYTES) return null
      if (!res.body) return null

      // Stream the body, enforcing the size cap as bytes arrive so we never
      // buffer more than MAX_AVATAR_BYTES even if Content-Length lied.
      const reader = res.body.getReader()
      const chunks: Buffer[] = []
      let total = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          total += value.byteLength
          if (total > MAX_AVATAR_BYTES) {
            await reader.cancel()
            return null
          }
          chunks.push(Buffer.from(value))
        }
      }
      if (total === 0) return null

      // --- Write to disk ---
      // userId is typed number — no path traversal possible via template literal.
      const filename = `avatar-tg-${userId}.jpg`
      await mkdir(UPLOADS_PATH, { recursive: true }) // matches ideas route pattern
      await writeFile(path.join(UPLOADS_PATH, filename), Buffer.concat(chunks, total))

      // Cache-bust: prefer the caller-supplied version; fall back to byte-length
      // (stable for identical photo data, no Date.now() dependency).
      const v = version !== undefined ? String(version) : String(total)
      return `/api/uploads/${filename}?v=${v}`
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    // Any unexpected error — never propagate to the login flow
    return null
  }
}
