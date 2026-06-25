import type { Metadata } from 'next'
import GateForm from './GateForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getDict, getClientDict, getLocale, LOCALES } from '@/lib/i18n/locale'

export const metadata: Metadata = {
  title: 'Team access · Uplore',
}

interface Props {
  searchParams: Promise<{ code?: string; next?: string }>
}

export default async function GatePage({ searchParams }: Props) {
  const { code, next } = await searchParams
  const redirectTo = next ?? '/'
  const t = await getDict()
  const ct = await getClientDict()
  const locale = await getLocale()

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
        <div
          className="wordmark"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
            fontSize: 18,
            color: 'var(--ink)',
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
        </div>

        <h1
          style={{
            fontSize: 19,
            fontWeight: 650,
            letterSpacing: '-0.02em',
            marginBottom: 6,
            color: 'var(--ink)',
          }}
        >
          {t.teamAccess}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {t.boardIsPrivate}
        </p>

        <GateForm initialCode={code} next={redirectTo} t={ct} />
      </div>

      {/* Language switcher below card */}
      <div style={{ marginTop: 18 }}>
        <LanguageSwitcher current={locale} locales={LOCALES} inline />
      </div>
    </main>
  )
}
