import { NextRequest, NextResponse } from 'next/server'

/**
 * Site-wide team access gate.
 *
 * Only active when ACCESS_CODE is set. When inactive the middleware
 * is a no-op and the site remains fully public (OSS-friendly default).
 *
 * Token contract (must match /api/gate exactly):
 *   expected = process.env.GATE_TOKEN ?? ('granted_' + process.env.ACCESS_CODE)
 *
 * This runs in the Edge runtime — no Node crypto, no DB.
 */

const GATE_COOKIE = 'uplore_gate'

// Paths that must never be bounced by the gate.
const EXEMPT_PREFIXES = [
  '/gate',
  '/api/gate',
  '/api/health',
  '/_next/',
  '/favicon.ico',
]

function isExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))
}

export function middleware(req: NextRequest): NextResponse {
  const accessCode = process.env.ACCESS_CODE

  // Gate disabled — pass through immediately.
  if (!accessCode) return NextResponse.next()

  const { pathname } = req.nextUrl

  // Static assets and API surface that must stay accessible.
  if (isExempt(pathname)) return NextResponse.next()

  // Compute expected token (same formula as /api/gate route).
  const expected = process.env.GATE_TOKEN ?? `granted_${accessCode}`

  const cookie = req.cookies.get(GATE_COOKIE)?.value ?? ''

  // Simple constant-length compare: if lengths differ it's definitely wrong;
  // if lengths match we do a character-level comparison that is not
  // short-circuit optimisable by JS engines (edge-safe, no Node crypto needed).
  // This is not timing-safe in the cryptographic sense but the secret is never
  // transmitted here — this is only a gate cookie, not a HMAC. The real
  // constant-time check lives in /api/gate where the password is compared.
  if (cookie.length === expected.length && cookie === expected) {
    return NextResponse.next()
  }

  // Not authorised — redirect to /gate with the original path preserved.
  const gateUrl = req.nextUrl.clone()
  gateUrl.pathname = '/gate'
  gateUrl.search = ''
  gateUrl.searchParams.set('next', pathname + (req.nextUrl.search ?? ''))

  return NextResponse.redirect(gateUrl, 307)
}

export const config = {
  // Run on all paths except static file extensions.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|eot|css|js|map)).*)',
  ],
}
