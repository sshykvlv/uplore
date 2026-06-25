import { NextRequest, NextResponse } from 'next/server'
import { telegramProvider } from '@/lib/auth/telegram-provider'
import { upsertUser, setUserAvatar } from '@/lib/auth/upsert-user'
import { createSession } from '@/lib/auth/session'
import { storeTelegramAvatar } from '@/lib/auth/store-avatar'

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

    // Download the widget photo_url locally while the link is fresh.
    // auth_date (seconds epoch) is used as the cache-bust version — it stays
    // stable for the same login session so repeated renders won't churn the URL.
    // storeTelegramAvatar never throws; null means the download was skipped/failed.
    const authDate = params.auth_date // already HMAC-verified above
    const localAvatar = await storeTelegramAvatar(userId, identity.avatarUrl, authDate)
    setUserAvatar(userId, localAvatar)

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
