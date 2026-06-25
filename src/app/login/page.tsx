import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import DevLoginForm from './DevLoginForm'

export const metadata = {
  title: 'Sign in · Uplore',
}

/**
 * /login page — a focused, vertically-centered auth screen (no global header),
 * visually a sibling of /gate. Everything is centered so the layout stays neat
 * across all states: Telegram widget, dev login, or a setup hint.
 *
 * The Telegram widget is emitted server-side as the official
 * <script data-telegram-login=...> tag via dangerouslySetInnerHTML so it works
 * with runtime env vars (no rebuild needed when bot username / PUBLIC_URL change).
 */
export default async function LoginPage() {
  const user = await getSession()
  if (user) redirect('/')

  const devLoginEnabled =
    process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production'

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim()
  const publicUrl = process.env.PUBLIC_URL?.trim()

  const authUrl = publicUrl
    ? `${publicUrl.replace(/\/$/, '')}/api/auth/telegram`
    : '/api/auth/telegram'

  const widgetHtml = botUsername
    ? `<script
        async
        src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${botUsername}"
        data-size="large"
        data-radius="20"
        data-auth-url="${authUrl}"
        data-request-access="write"
      ></script>`
    : null
  const hasTelegramWidget = Boolean(widgetHtml)

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: '36px 28px 32px',
          boxShadow: '0 4px 24px rgba(0,0,0,.05)',
          textAlign: 'center',
        }}
      >
        {/* Brand mark */}
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 650,
            fontSize: 18,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            textDecoration: 'none',
            marginBottom: 22,
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'linear-gradient(150deg,#ff7a45,#e8602c)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 15,
              boxShadow: '0 2px 8px rgba(232,96,44,.35)',
            }}
          >
            ✦
          </span>
          Uplore
        </a>

        <h1
          style={{
            fontSize: 19,
            fontWeight: 650,
            letterSpacing: '-0.02em',
            marginBottom: 6,
            color: 'var(--ink)',
          }}
        >
          Sign in
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            lineHeight: 1.5,
            marginBottom: 26,
          }}
        >
          Sign in to post ideas, vote, and comment.
        </p>

        {hasTelegramWidget && (
          /* Telegram's JS replaces this <script> with the iframe button.
             min-height reserves space so the card doesn't jump while it loads. */
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              minHeight: 48,
            }}
            dangerouslySetInnerHTML={{ __html: widgetHtml! }}
          />
        )}

        {!hasTelegramWidget && !devLoginEnabled && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'var(--accent-soft)',
              border: '1px solid #f3b79b',
              fontSize: 13,
              color: '#9a3410',
              textAlign: 'left',
            }}
          >
            Set <code>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code> to enable Telegram login.
          </div>
        )}

        {devLoginEnabled && (
          <>
            {hasTelegramWidget && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: '20px 0 16px',
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
  )
}
