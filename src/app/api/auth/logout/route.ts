import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

/**
 * POST /api/auth/logout — clear the session cookie and redirect home.
 *
 * Logout is POST-only ON PURPOSE: a GET handler that destroyed the session
 * was being auto-fired by Next.js <Link> prefetch (`?_rsc=`), silently logging
 * users out right after sign-in. GET must be safe/idempotent — it never
 * touches the session.
 */
/**
 * Behind the reverse proxy `req.url` carries the internal container host
 * (e.g. http://0.0.0.0:3000), so redirecting to it dumps the user on a raw
 * internal address. Prefer PUBLIC_URL when set (same fix as the Telegram
 * callback).
 */
function homeRedirect(req: NextRequest): URL {
  const publicUrl = process.env.PUBLIC_URL?.trim()
  return publicUrl ? new URL('/', publicUrl) : new URL('/', req.url)
}

export async function POST(req: NextRequest) {
  await destroySession()
  return NextResponse.redirect(homeRedirect(req), 303)
}

/** GET is a no-op redirect — never destroys the session (prefetch-safe). */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(homeRedirect(req))
}
