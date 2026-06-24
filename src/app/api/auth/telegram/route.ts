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

    // When deployed behind a reverse proxy, req.url may arrive as http://
    // even though the public site is https. Use PUBLIC_URL origin if set so
    // the redirect always goes to the correct scheme and host.
    const publicUrl = process.env.PUBLIC_URL?.trim()
    const redirectTarget = publicUrl
      ? new URL('/', publicUrl)
      : new URL('/', req.url)

    return NextResponse.redirect(redirectTarget)
  } catch (err) {
    console.error('[auth/telegram]', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}
