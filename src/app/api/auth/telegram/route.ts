import { NextRequest, NextResponse } from 'next/server'
import { verifyCallback } from '@/lib/auth/telegram-oidc'
import { verifyPending, PENDING_AUTH_COOKIE } from '@/lib/auth/oidc-pending'
import { upsertUser, setUserAvatar } from '@/lib/auth/upsert-user'
import { createSession } from '@/lib/auth/session'
import { storeTelegramAvatar } from '@/lib/auth/store-avatar'

interface PendingAuth {
  state: string
  nonce: string
  codeVerifier: string
}

/**
 * GET /api/auth/telegram
 *
 * OIDC callback: Telegram redirects here with `code`/`state` after the user
 * approves the login started at /api/auth/telegram/start. Exchanges the
 * code for an id_token, validates it, upserts the user, creates a session,
 * then redirects to /. Any failure (missing/invalid pending cookie, state
 * mismatch, failed exchange/verification) redirects to /?error=telegram.
 */
export async function GET(req: NextRequest) {
  const publicUrl = process.env.PUBLIC_URL?.trim()
  const errorRedirect = publicUrl
    ? new URL('/?error=telegram', publicUrl)
    : new URL('/?error=telegram', req.url)

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const pending = verifyPending<PendingAuth>(req.cookies.get(PENDING_AUTH_COOKIE)?.value)

  if (!code || !state || !pending || pending.state !== state) {
    console.warn('[auth/telegram] missing/invalid code, state, or pending cookie')
    const res = NextResponse.redirect(errorRedirect)
    res.cookies.delete(PENDING_AUTH_COOKIE)
    return res
  }

  try {
    const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID?.trim()
    const clientSecret = process.env.TELEGRAM_OIDC_CLIENT_SECRET?.trim()
    if (!clientId || !clientSecret) {
      throw new Error('TELEGRAM_OIDC_CLIENT_ID/TELEGRAM_OIDC_CLIENT_SECRET not configured')
    }

    const redirectUri = publicUrl
      ? new URL('/api/auth/telegram', publicUrl).toString()
      : new URL('/api/auth/telegram', req.url).toString()

    const identity = await verifyCallback({
      code,
      clientId,
      clientSecret,
      redirectUri,
      codeVerifier: pending.codeVerifier,
      expectedNonce: pending.nonce,
    })

    const userId = upsertUser('telegram', {
      providerId: identity.telegramId,
      username: identity.username,
      displayName: identity.name,
      avatarUrl: identity.photo,
    })

    // Download the OIDC picture locally while the link is fresh (t.me
    // hotlinks expire). There's no auth_date in the OIDC flow, so use the
    // current timestamp as the cache-bust version. Avatar handling must
    // NEVER fail the login.
    if (identity.photo) {
      const localAvatar = await storeTelegramAvatar(userId, identity.photo, String(Date.now()))
      if (localAvatar) {
        setUserAvatar(userId, localAvatar)
      } else {
        // Transient download failure (timeout/404/redirect/etc) — keep any
        // existing avatar instead of clobbering it to null.
        console.warn('[auth/telegram] avatar download failed; keeping existing avatar', { userId })
      }
    } else {
      // No Telegram photo on the account — clear any stale stored avatar.
      setUserAvatar(userId, null)
    }

    await createSession(userId)

    // When deployed behind a reverse proxy, req.url may arrive as http://
    // even though the public site is https. Use PUBLIC_URL origin if set so
    // the redirect always goes to the correct scheme and host.
    const redirectTarget = publicUrl ? new URL('/', publicUrl) : new URL('/', req.url)

    const res = NextResponse.redirect(redirectTarget)
    res.cookies.delete(PENDING_AUTH_COOKIE)
    return res
  } catch (err) {
    console.error('[auth/telegram]', err)
    const res = NextResponse.redirect(errorRedirect)
    res.cookies.delete(PENDING_AUTH_COOKIE)
    return res
  }
}
