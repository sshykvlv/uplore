import { it, expect } from 'vitest'

process.env.SESSION_SECRET = 'test-secret'

import { signPending, verifyPending } from '@/lib/auth/oidc-pending'

it('round-trips a signed payload', () => {
  const c = signPending({ state: 's', nonce: 'n', codeVerifier: 'v' }, 600)
  const out = verifyPending<{ state: string }>(c)
  expect(out?.state).toBe('s')
})

it('rejects a tampered cookie', () => {
  const c = signPending({ state: 's' }, 600) + 'x'
  expect(verifyPending(c)).toBeNull()
})

it('rejects an expired cookie', () => {
  const c = signPending({ state: 's' }, -1) // already expired
  expect(verifyPending(c)).toBeNull()
})

it('rejects a missing cookie', () => {
  expect(verifyPending(undefined)).toBeNull()
})
