import crypto from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const ISSUER = 'https://oauth.telegram.org'
const AUTH_ENDPOINT = 'https://oauth.telegram.org/auth'
const TOKEN_ENDPOINT = 'https://oauth.telegram.org/token'
const JWKS_URI = 'https://oauth.telegram.org/.well-known/jwks.json'

export interface OidcIdentity {
  telegramId: string
  name?: string
  username?: string
  photo?: string
}

export interface AuthStart {
  url: string
  state: string
  nonce: string
  codeVerifier: string
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Builds the authorize redirect URL with PKCE S256 + state + nonce. */
export async function buildAuthUrl(opts: { clientId: string; redirectUri: string }): Promise<AuthStart> {
  const state = b64url(crypto.randomBytes(16))
  const nonce = b64url(crypto.randomBytes(16))
  const codeVerifier = b64url(crypto.randomBytes(32))
  const codeChallenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest())
  const url = new URL(AUTH_ENDPOINT)
  url.searchParams.set('client_id', opts.clientId)
  url.searchParams.set('redirect_uri', opts.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile')
  url.searchParams.set('state', state)
  url.searchParams.set('nonce', nonce)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  return { url: url.toString(), state, nonce, codeVerifier }
}

// Lazily-created JWKS set (caches keys, refetches on rotation). Injectable-free:
// jose fetches via global fetch, which tests stub.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URI))
  return jwks
}

/** Exchanges the authorization code and validates the returned id_token. */
export async function verifyCallback(opts: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
  codeVerifier: string
  expectedNonce: string
}): Promise<OidcIdentity> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: opts.code,
    redirect_uri: opts.redirectUri,
    code_verifier: opts.codeVerifier,
    client_id: opts.clientId,
    client_secret: opts.clientSecret, // client_secret_post
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`token endpoint ${res.status}`)
  const tokens = (await res.json()) as { id_token?: string }
  if (!tokens.id_token) throw new Error('no id_token in token response')

  const { payload } = await jwtVerify(tokens.id_token, getJwks(), {
    issuer: ISSUER,
    audience: opts.clientId,
  })
  if (payload.nonce !== opts.expectedNonce) throw new Error('nonce mismatch')
  if (!payload.sub) throw new Error('no sub in id_token')

  return {
    telegramId: String(payload.sub),
    name: typeof payload.name === 'string' ? payload.name : undefined,
    username: typeof payload.preferred_username === 'string' ? payload.preferred_username : undefined,
    photo: typeof payload.picture === 'string' ? payload.picture : undefined,
  }
}
