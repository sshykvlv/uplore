import { describe, it, expect, vi, beforeAll } from 'vitest'
import { generateKeyPair, SignJWT, exportJWK } from 'jose'
import { verifyCallback } from '@/lib/auth/telegram-oidc'

const ISS = 'https://oauth.telegram.org'
const CLIENT_ID = 'test-client-id'

let priv: CryptoKey, pub: CryptoKey, jwk: Record<string, unknown>

beforeAll(async () => {
  const kp = await generateKeyPair('RS256')
  priv = kp.privateKey
  pub = kp.publicKey
  jwk = await exportJWK(pub)
  jwk.kid = 'test-kid'
  jwk.alg = 'RS256'
  jwk.use = 'sig'
})

// Mock the remote JWKS fetch so verifyCallback validates against our test key,
// and mock the token endpoint exchange so no network is hit.
function mockFetch(idToken: string) {
  return vi.fn(async (url: string | URL | Request) => {
    const u = String(url)
    if (u.includes('/.well-known/jwks.json')) {
      return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } })
    }
    if (u.includes('/token')) {
      return new Response(JSON.stringify({ id_token: idToken, access_token: 'x', token_type: 'Bearer' }), {
        headers: { 'content-type': 'application/json' },
      })
    }
    throw new Error(`unexpected fetch ${u}`)
  })
}

async function signIdToken(claims: Record<string, unknown>, nonce: string): Promise<string> {
  return await new SignJWT({ preferred_username: 'alice', name: 'Alice', picture: 'https://t.me/x.jpg', nonce, ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuer(ISS)
    .setAudience(CLIENT_ID)
    .setSubject('42')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(priv)
}

describe('verifyCallback', () => {
  it('verifies a valid id_token and returns identity', async () => {
    const nonce = 'nonce-1'
    const idToken = await signIdToken({}, nonce)
    vi.stubGlobal('fetch', mockFetch(idToken))
    const id = await verifyCallback({
      code: 'abc',
      clientId: CLIENT_ID,
      clientSecret: 'sec',
      redirectUri: 'https://ideas.norm.place/api/telegram/callback',
      codeVerifier: 'verifier',
      expectedNonce: nonce,
    })
    expect(id.telegramId).toBe('42')
    expect(id.username).toBe('alice')
    expect(id.name).toBe('Alice')
  })

  it('rejects a wrong audience', async () => {
    const nonce = 'nonce-2'
    const idToken = await new SignJWT({ nonce })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
      .setIssuer(ISS)
      .setAudience('someone-else')
      .setSubject('42')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(priv)
    vi.stubGlobal('fetch', mockFetch(idToken))
    await expect(
      verifyCallback({
        code: 'abc',
        clientId: CLIENT_ID,
        clientSecret: 'sec',
        redirectUri: 'r',
        codeVerifier: 'v',
        expectedNonce: nonce,
      }),
    ).rejects.toThrow()
  })

  it('rejects a nonce mismatch', async () => {
    const idToken = await signIdToken({}, 'signed-nonce')
    vi.stubGlobal('fetch', mockFetch(idToken))
    await expect(
      verifyCallback({
        code: 'abc',
        clientId: CLIENT_ID,
        clientSecret: 'sec',
        redirectUri: 'r',
        codeVerifier: 'v',
        expectedNonce: 'different',
      }),
    ).rejects.toThrow()
  })
})
