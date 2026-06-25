import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * POST /api/gate
 *
 * Body: { code: string, next?: string }
 *
 * Compares `code` against ACCESS_CODE using Node's crypto.timingSafeEqual.
 * On match sets the uplore_gate cookie to the GATE_TOKEN value and returns
 * { ok: true }. The client is responsible for the redirect.
 *
 * Token formula (must match middleware.ts exactly):
 *   token = process.env.GATE_TOKEN ?? ('granted_' + process.env.ACCESS_CODE)
 */

const GATE_COOKIE = 'uplore_gate'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 days

function timingSafeEqual(a: string, b: string): boolean {
  // Buffers must be the same length for timingSafeEqual.
  // If lengths differ we still do the call (on padded equal-length copies) so
  // that the timing stays constant, then return false regardless.
  const aLen = Buffer.byteLength(a)
  const bLen = Buffer.byteLength(b)
  const maxLen = Math.max(aLen, bLen)

  const aBuf = Buffer.alloc(maxLen)
  const bBuf = Buffer.alloc(maxLen)
  aBuf.write(a)
  bBuf.write(b)

  const equal = crypto.timingSafeEqual(aBuf, bBuf)
  return equal && aLen === bLen
}

export async function POST(req: NextRequest) {
  const accessCode = process.env.ACCESS_CODE

  // Gate disabled — always grant access.
  if (!accessCode) {
    return NextResponse.json({ ok: true })
  }

  let body: { code?: string; next?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = typeof body.code === 'string' ? body.code : ''

  if (!timingSafeEqual(code, accessCode)) {
    return NextResponse.json({ error: 'Wrong code' }, { status: 401 })
  }

  // Determine the token to write into the cookie (same formula as middleware).
  const gateToken = process.env.GATE_TOKEN ?? `granted_${accessCode}`

  const res = NextResponse.json({ ok: true })
  res.cookies.set(GATE_COOKIE, gateToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })

  return res
}
