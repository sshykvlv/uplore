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
 *   - Dev login form (when ALLOW_DEV_LOGIN=true) — for local demos
 *   - Placeholder for Telegram Login Widget (wired up in Phase B when TELEGRAM_BOT_TOKEN is set)
 */
export default async function LoginPage() {
  const user = await getSession()
  if (user) redirect('/')

  const devLoginEnabled = process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production'
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN

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

          {/* Telegram Widget placeholder — Phase B wires this up */}
          {telegramBotToken ? (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              {/* Phase B: inject Telegram Login Widget script here */}
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                Telegram Login Widget (Phase B)
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'var(--accent-soft)',
                border: '1px solid #f3b79b',
                fontSize: 13,
                color: '#9a3410',
                marginBottom: devLoginEnabled ? 20 : 0,
              }}
            >
              Set <code>TELEGRAM_BOT_TOKEN</code> to enable Telegram login.
            </div>
          )}

          {devLoginEnabled && (
            <>
              {telegramBotToken && (
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
