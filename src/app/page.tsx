import { getSession } from '@/lib/auth/session'
import Header from '@/components/Header'

/**
 * Home page — Phase A placeholder.
 * Phase B will replace the <main> body with the live feed.
 */
export default async function HomePage() {
  const user = await getSession()

  return (
    <>
      <Header user={user} />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '40px 16px 60px',
          textAlign: 'center',
        }}
      >
        {user ? (
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Welcome, {user.display_name ?? user.username ?? 'friend'}!
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              Feed coming soon — Phase B will show ideas here.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
              Feed coming soon
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>
              Sign in to start voting and posting ideas.
            </p>
          </div>
        )}
      </main>

      <footer
        style={{
          textAlign: 'center',
          color: '#bdbdb7',
          fontSize: 12.5,
          padding: 24,
        }}
      >
        Uplore · open source
      </footer>
    </>
  )
}
