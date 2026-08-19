import crypto from 'node:crypto'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is not set')
  return secret
}

export const PENDING_AUTH_COOKIE = 'uplore_oidc_pending'

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}

function hmac(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

/** Signs `obj` with a TTL (seconds); value is `<b64url-json>.<hmac>`. */
export function signPending(obj: Record<string, unknown>, ttlSec: number): string {
  const withExp = { ...obj, exp: Math.floor(Date.now() / 1000) + ttlSec }
  const payload = b64urlJson(withExp)
  return `${payload}.${hmac(payload)}`
}

/** Verifies signature + TTL; returns the payload (minus exp check) or null. */
export function verifyPending<T = Record<string, unknown>>(cookie: string | undefined | null): T | null {
  if (!cookie || typeof cookie !== 'string') return null
  const dot = cookie.lastIndexOf('.')
  if (dot === -1) return null
  const payload = cookie.slice(0, dot)
  const sig = cookie.slice(dot + 1)
  const expected = hmac(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  let obj: { exp?: number } & Record<string, unknown>
  try {
    obj = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (typeof obj.exp !== 'number' || obj.exp < Math.floor(Date.now() / 1000)) return null
  return obj as T
}
