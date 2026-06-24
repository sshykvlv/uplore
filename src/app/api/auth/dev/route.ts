import { NextRequest, NextResponse } from 'next/server'
import { upsertUser } from '@/lib/auth/upsert-user'
import { createSession } from '@/lib/auth/session'

/**
 * POST /api/auth/dev
 *
 * Dev-only login for local demos. Gated behind ALLOW_DEV_LOGIN=true.
 * Body: { username: string }
 *
 * NEVER enabled in production.
 */
export async function POST(req: NextRequest) {
  if (process.env.ALLOW_DEV_LOGIN !== 'true' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Dev login not available' }, { status: 403 })
  }

  let body: { username?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const username = (body.username ?? '').trim()
  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 })
  }

  const userId = upsertUser('dev', {
    providerId: `dev_${username}`,
    username,
    displayName: username,
  })

  await createSession(userId)

  return NextResponse.json({ ok: true, userId })
}
