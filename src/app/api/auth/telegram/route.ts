import { NextRequest, NextResponse } from 'next/server'
import { telegramProvider } from '@/lib/auth/telegram-provider'
import { upsertUser } from '@/lib/auth/upsert-user'
import { createSession } from '@/lib/auth/session'

/**
 * GET /api/auth/telegram
 * Telegram Login Widget posts back as a query-string redirect.
 * Validates, upserts the user, creates a session, then redirects to /.
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())

  try {
    const identity = await telegramProvider.verify(params)
    const userId = upsertUser('telegram', identity)
    await createSession(userId)
    return NextResponse.redirect(new URL('/', req.url))
  } catch (err) {
    console.error('[auth/telegram]', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}
