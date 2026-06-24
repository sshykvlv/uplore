import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import Header from '@/components/Header'
import DevLoginForm from './DevLoginForm'

export const metadata = {
  title: 'Sign in · Uplore',
}

/**
 * /login page.
 *
 * Shows:
 *   - Telegram Login Widget (when NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is set)
 *   - Dev login form (when ALLOW_DEV_LOGIN=true) — for local demos
 *
 * The widget is rendered as a server component that emits the official
 * <script data-telegram-login=...> tag via dangerouslySetInnerHTML so it
 * works with runtime env vars (no rebuild required on changes to bot username
 * or PUBLIC_URL, since App Router server components read process.env at
 * request time, not at build time).
 */
export default async function LoginPage() {
  const user = await getSession()
  if (user) redirect('/')

  const devLoginEnabled = process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production'

  // Both vars are read server-side at runtime — no NEXT_PUBLIC build-time
  // embedding issue for the server component path.
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim()
  const publicUrl = process.env.PUBLIC_URL?.trim()

  // Build the auth-url for the widget: use PUBLIC_URL origin if set,
  // otherwise fall back to a root-relative path (works when served from origin).
  const authUrl = publicUrl
    ? `${publicUrl.replace(/\/$/, '')}/api/auth/telegram`
    : '/api/auth/telegram'

  // Raw script tag injected server-side so the Telegram CDN script loads as
  // a real DOM element where the widget iframe button renders.
  const widgetHtml = botUsername
    ? `<script
        async
        src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${botUsername}"
        data-size="large"
        data-auth-url="${authUrl}"
        data-request-access="write"
      ></script>`
    : null

  const hasTelegramWidget = Boolean(widgetHtml)

  return (
    <>
      <Header user={null} />
      <main
        style={{
          maxWidth: 400,
          margin: '60px auto',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '32px 28px',
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 650,
              letterSpacing: '-0.02em',
              marginBottom: 24,
              color: 'var(--ink)',
            }}
          >
            Sign in to Uplore
          </h1>

          {hasTelegramWidget ? (
            /* Official Telegram Login Widget — server-rendered <script> tag.
               Telegram's JS replaces the script element with an iframe button. */
            <div
              style={{ marginBottom: 20, textAlign: 'center' }}
              dangerouslySetInnerHTML={{ __html: widgetHtml! }}
            />
          ) : (
            /* Neither bot username nor dev login: show a setup hint */
            !devLoginEnabled && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--accent-soft)',
                  border: '1px solid #f3b79b',
                  fontSize: 13,
                  color: '#9a3410',
                  marginBottom: 0,
                }}
              >
                Set <code>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code> to enable Telegram login.
              </div>
            )
          )}

          {devLoginEnabled && (
            <>
              {hasTelegramWidget && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    color: 'var(--muted)',
                    fontSize: 12,
                  }}
                >
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
                  or dev login
                  <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
                </div>
              )}
              <DevLoginForm />
            </>
          )}
        </div>
      </main>
    </>
  )
}
