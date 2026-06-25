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
export async function POST(req: NextRequest) {
  await destroySession()
  return NextResponse.redirect(new URL('/', req.url), 303)
}

/** GET is a no-op redirect — never destroys the session (prefetch-safe). */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/', req.url))
}
