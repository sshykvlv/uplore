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
          padding: '36px 28px',
          boxShadow: '0 4px 24px rgba(0,0,0,.05)',
        }}
      >
        {/* Ember accent dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--accent)',
            marginBottom: 20,
          }}
        />

        <h1
          style={{
            fontSize: 20,
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
          This Uplore board is private. Enter the team password to continue.
        </p>

        <GateForm initialCode={code} next={redirectTo} />
      </div>
    </main>
  )
}
