import crypto from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const COOKIE_NAME = 'uplore_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is not set')
  return secret
}

function sign(value: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(value)
  return `${value}.${hmac.digest('base64url')}`
}

function unsign(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value)
  // constant-time compare
  if (signed.length !== expected.length) return null
  const a = Buffer.from(signed)
  const b = Buffer.from(expected)
  try {
    if (!crypto.timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return value
}

export interface SessionUser {
  id: number
  provider: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

/** Read and verify the session cookie. Returns the user row or null. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null

  const userId = unsign(raw)
  if (!userId) return null

  const id = parseInt(userId, 10)
  if (isNaN(id)) return null

  const user = db
    .prepare('SELECT id, provider, username, display_name, avatar_url FROM users WHERE id = ?')
    .get(id) as SessionUser | undefined

  return user ?? null
}

/** Set a signed session cookie for the given user id. */
export async function createSession(userId: number): Promise<void> {
  const store = await cookies()
  const signed = sign(String(userId))
  store.set(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
}

/** Clear the session cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
