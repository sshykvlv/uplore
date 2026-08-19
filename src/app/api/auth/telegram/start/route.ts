import { NextRequest, NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/auth/telegram-oidc'
import { signPending, PENDING_AUTH_COOKIE } from '@/lib/auth/oidc-pending'

const PENDING_TTL_SEC = 600

/**
 * GET /api/auth/telegram/start
 *
 * Kicks off Telegram Login via OIDC: builds the authorize URL (PKCE S256 +
 * state + nonce), signs {state, nonce, codeVerifier} into a short-lived
 * pending cookie, then redirects the browser to Telegram's authorize
 * endpoint. The callback (GET /api/auth/telegram) reads the pending cookie
 * back to complete the code exchange.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.TELEGRAM_OIDC_CLIENT_ID?.trim()
  if (!clientId) {
    console.error('[auth/telegram/start] TELEGRAM_OIDC_CLIENT_ID not configured')
    return NextResponse.json({ error: 'Telegram login not configured' }, { status: 500 })
  }

  // When deployed behind a reverse proxy, req.url may arrive as http://
  // even though the public site is https. Use PUBLIC_URL origin if set so
  // the redirect_uri always matches what's registered with Telegram.
  const publicUrl = process.env.PUBLIC_URL?.trim()
  const redirectUri = publicUrl
    ? new URL('/api/auth/telegram', publicUrl).toString()
    : new URL('/api/auth/telegram', req.url).toString()

  try {
    const { url, state, nonce, codeVerifier } = await buildAuthUrl({ clientId, redirectUri })

    const pending = signPending({ state, nonce, codeVerifier }, PENDING_TTL_SEC)

    const res = NextResponse.redirect(url)
    res.cookies.set(PENDING_AUTH_COOKIE, pending, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: PENDING_TTL_SEC,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch (error) {
    const errorUrl = publicUrl
      ? new URL('/?error=telegram', publicUrl).toString()
      : new URL('/?error=telegram', req.url).toString()
    return NextResponse.redirect(errorUrl)
  }
}
