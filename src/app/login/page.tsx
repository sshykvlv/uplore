import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import DevLoginForm from './DevLoginForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import TelegramLoginButton from '@/components/TelegramLoginButton'
import { getDict, getLocale, LOCALES } from '@/lib/i18n/locale'

export const metadata = {
  title: 'Sign in · Norm Ideas',
}

export default async function LoginPage() {
  const user = await getSession()
  if (user) redirect('/')

  const t = await getDict()
  const locale = await getLocale()

  const devLoginEnabled =
    process.env.ALLOW_DEV_LOGIN === 'true' && process.env.NODE_ENV !== 'production'

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
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
          className="wordmark"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontWeight: 700,
            fontSize: 22,
            color: 'var(--ink)',
            textDecoration: 'none',
            marginBottom: 22,
          }}
        >
          Norm Ideas
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
          {t.signInHeading}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            lineHeight: 1.5,
            marginBottom: 26,
          }}
        >
          {t.signInSubheading}
        </p>

        <TelegramLoginButton />

        {devLoginEnabled && (
          <>
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
              {t.orDevLogin}
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--line)' }} />
            </div>
            <DevLoginForm />
          </>
        )}
      </div>

      {/* Language switcher below card */}
      <div style={{ marginTop: 18 }}>
        <LanguageSwitcher current={locale} locales={LOCALES} inline />
      </div>
    </main>
  )
}
