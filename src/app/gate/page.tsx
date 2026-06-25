import type { Metadata } from 'next'
import GateForm from './GateForm'

export const metadata: Metadata = {
  title: 'Team access · Uplore',
}

interface Props {
  searchParams: Promise<{ code?: string; next?: string }>
}

/**
 * /gate — team access gate page.
 *
 * Renders a password card matching the app's visual language.
 * When ?code= is present the embedded client component (GateForm)
 * auto-submits it on mount — this is the shareable-link flow.
 * On success /api/gate sets the uplore_gate cookie and GateForm
 * redirects to ?next (default /).
 */
export default async function GatePage({ searchParams }: Props) {
  const { code, next } = await searchParams
  const redirectTo = next ?? '/'

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
        {/* Brand mark — same as the login screen */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 650,
            fontSize: 18,
            letterSpacing: '-0.02em',
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
          Team access
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'var(--muted)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          This board is private. Enter the team password to continue.
        </p>

        <GateForm initialCode={code} next={redirectTo} />
      </div>
    </main>
  )
}
