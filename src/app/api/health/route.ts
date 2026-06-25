import { NextResponse } from 'next/server'

/**
 * GET /api/health
 *
 * Trivial liveness probe used by Docker / docker-compose HEALTHCHECK.
 * Always exempt from the team access gate (see middleware.ts).
 */
export async function GET() {
  return NextResponse.json({ ok: true })
}
