import Link from 'next/link'
import type { SessionUser } from '@/lib/auth/session'
import NewIdeaModal from '@/components/NewIdeaModal'
import type { Dict, ClientDict } from '@/lib/i18n/dictionaries'

interface HeaderProps {
  user: SessionUser | null
  /** Full server-side dict for server-rendered strings */
  t: Dict
  /** Serializable client dict passed through to client components */
  ct: ClientDict
}

function initials(user: SessionUser): string {
  const name = user.display_name ?? user.username ?? '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Floating rounded header.
 * Sticky, blurred white, subtle shadow.
 */
export default async function Header({ user, t, ct }: HeaderProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        padding: '14px 16px 6px',
        background: 'linear-gradient(var(--bg), var(--bg) 65%, rgba(251,251,250,0))',
      }}
    >
      <div
        style={{
          maxWidth: 716,
          margin: '0 auto',
          padding: '7px 9px 7px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: '0 3px 12px rgba(0,0,0,.045)',
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 650,
            fontSize: 18,
            letterSpacing: '-0.02em',
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 7,
              background: 'linear-gradient(150deg,#ff7a45,#e8602c)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(232,96,44,.35)',
            }}
          >
            ✦
          </span>
          Uplore
        </Link>

        <div style={{ flex: 1 }} />

        {/* New idea modal — passes serializable client dict */}
        <NewIdeaModal authed={!!user} t={ct} />

        {user ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.display_name ?? user.username ?? 'avatar'}
                width={32}
                height={32}
                style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#d8d8d4',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#666',
                  flexShrink: 0,
                }}
              >
                {initials(user)}
              </div>
            )}

            <Link
              href="/api/auth/logout"
              style={{
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 13,
                fontWeight: 500,
                padding: '0 12px',
                borderRadius: 9999,
                border: '1px solid var(--line)',
                background: 'var(--card)',
                color: 'var(--muted)',
              }}
            >
              {t.signOut}
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 550,
              padding: '0 14px',
              borderRadius: 9999,
              border: '1px solid var(--line)',
              background: 'var(--card)',
              color: 'var(--ink)',
            }}
          >
            {t.signIn}
          </Link>
        )}
      </div>
    </header>
  )
}
