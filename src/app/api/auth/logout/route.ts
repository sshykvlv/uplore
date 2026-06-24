import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session'

/**
 * POST /api/auth/logout — clear session cookie and redirect to /.
 */
export async function POST(req: NextRequest) {
  await destroySession()
  return NextResponse.redirect(new URL('/', req.url))
}

/** Allow GET so a plain link works too (e.g. <a href="/api/auth/logout">) */
export async function GET(req: NextRequest) {
  await destroySession()
  return NextResponse.redirect(new URL('/', req.url))
}
