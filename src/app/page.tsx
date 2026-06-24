import { getSession } from '@/lib/auth/session'
import { getFeedIdeas } from '@/lib/queries'
import Header from '@/components/Header'
import IdeaCard from '@/components/IdeaCard'

export const dynamic = 'force-dynamic'

/**
 * Home page — live feed of ideas sorted by score DESC.
 */
export default async function HomePage() {
  const user = await getSession()
  const ideas = getFeedIdeas(user?.id ?? null)

  return (
    <>
      <Header user={user} />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '10px 16px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            padding: '6px 6px 14px',
          }}
        >
          <h1
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
            }}
          >
            Ideas · by votes
          </h1>
        </div>

        {ideas.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 16px',
              color: 'var(--muted)',
            }}
          >
            <p style={{ fontSize: 16, marginBottom: 8 }}>No ideas yet.</p>
            <p style={{ fontSize: 14 }}>Be the first to post one!</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} authed={!!user} />
            ))}
          </ul>
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
