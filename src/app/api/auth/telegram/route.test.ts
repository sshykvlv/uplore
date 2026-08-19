import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Set required env before any module under test reads it at call time.
process.env.SESSION_SECRET = 'test-secret'
process.env.PUBLIC_URL = 'http://localhost:3000'
process.env.TELEGRAM_OIDC_CLIENT_ID = 'test-client-id'
process.env.TELEGRAM_OIDC_CLIENT_SECRET = 'test-client-secret'

vi.mock('@/lib/auth/telegram-oidc', () => ({
  verifyCallback: vi.fn(),
}))
vi.mock('@/lib/auth/upsert-user', () => ({
  upsertUser: vi.fn(),
  setUserAvatar: vi.fn(),
}))
vi.mock('@/lib/auth/session', () => ({
  createSession: vi.fn(),
}))
vi.mock('@/lib/auth/store-avatar', () => ({
  storeTelegramAvatar: vi.fn(),
}))

import { GET } from './route'
import { verifyCallback } from '@/lib/auth/telegram-oidc'
import { upsertUser, setUserAvatar } from '@/lib/auth/upsert-user'
import { createSession } from '@/lib/auth/session'
import { storeTelegramAvatar } from '@/lib/auth/store-avatar'
import { signPending, PENDING_AUTH_COOKIE } from '@/lib/auth/oidc-pending'

const mockVerifyCallback = vi.mocked(verifyCallback)
const mockUpsertUser = vi.mocked(upsertUser)
const mockSetUserAvatar = vi.mocked(setUserAvatar)
const mockCreateSession = vi.mocked(createSession)
const mockStoreTelegramAvatar = vi.mocked(storeTelegramAvatar)

function buildRequest(query: Record<string, string>, pendingCookie?: string): NextRequest {
  const url = new URL('http://localhost:3000/api/auth/telegram')
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
  const headers = new Headers()
  if (pendingCookie) headers.set('cookie', `${PENDING_AUTH_COOKIE}=${pendingCookie}`)
  return new NextRequest(url, { headers })
}

describe('GET /api/auth/telegram (OIDC callback)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('success path: exchanges code, upserts user, sets avatar, creates session, redirects to PUBLIC_URL', async () => {
    const pending = signPending({ state: 'state-1', nonce: 'nonce-1', codeVerifier: 'verifier-1' }, 600)
    mockVerifyCallback.mockResolvedValue({
      telegramId: '42',
      name: 'Alice',
      username: 'alice',
      photo: 'https://t.me/photo.jpg',
    })
    mockUpsertUser.mockReturnValue(7)
    mockStoreTelegramAvatar.mockResolvedValue('/api/uploads/avatar-tg-7.jpg?v=123')

    const req = buildRequest({ code: 'auth-code', state: 'state-1' }, pending)
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/')

    expect(mockVerifyCallback).toHaveBeenCalledWith({
      code: 'auth-code',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/api/auth/telegram',
      codeVerifier: 'verifier-1',
      expectedNonce: 'nonce-1',
    })
    expect(mockUpsertUser).toHaveBeenCalledWith('telegram', {
      providerId: '42',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: 'https://t.me/photo.jpg',
    })
    expect(mockStoreTelegramAvatar).toHaveBeenCalledWith(7, 'https://t.me/photo.jpg', expect.any(String))
    expect(mockSetUserAvatar).toHaveBeenCalledWith(7, '/api/uploads/avatar-tg-7.jpg?v=123')
    expect(mockCreateSession).toHaveBeenCalledWith(7)

    // Pending cookie is cleared on the success path too.
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(PENDING_AUTH_COOKIE)
  })

  it('state mismatch: redirects to error, no exchange/session/upsert happens', async () => {
    const pending = signPending({ state: 'state-1', nonce: 'nonce-1', codeVerifier: 'verifier-1' }, 600)
    const req = buildRequest({ code: 'auth-code', state: 'different-state' }, pending)

    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/?error=telegram')
    expect(mockVerifyCallback).not.toHaveBeenCalled()
    expect(mockUpsertUser).not.toHaveBeenCalled()
    expect(mockCreateSession).not.toHaveBeenCalled()

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(PENDING_AUTH_COOKIE)
  })

  it('missing pending cookie: redirects to error, no exchange/session happens', async () => {
    const req = buildRequest({ code: 'auth-code', state: 'state-1' })

    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/?error=telegram')
    expect(mockVerifyCallback).not.toHaveBeenCalled()
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('verifyCallback throws: redirects to error, no session created', async () => {
    const pending = signPending({ state: 'state-1', nonce: 'nonce-1', codeVerifier: 'verifier-1' }, 600)
    mockVerifyCallback.mockRejectedValue(new Error('token endpoint 400'))

    const req = buildRequest({ code: 'auth-code', state: 'state-1' }, pending)
    const res = await GET(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/?error=telegram')
    expect(mockCreateSession).not.toHaveBeenCalled()
  })
})
