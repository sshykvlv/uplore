import { getSession } from '@/lib/auth/session'
import { getFeedIdeas } from '@/lib/queries'
import Header from '@/components/Header'
import IdeaCard from '@/components/IdeaCard'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getDict, getClientDict, getLocale, LOCALES } from '@/lib/i18n/locale'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getSession()
  const ideas = getFeedIdeas(user?.id ?? null)
  const t = await getDict()
  const ct = await getClientDict()
  const locale = await getLocale()

  return (
    <>
      <Header user={user} t={t} ct={ct} />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '10px 18px 60px',
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
            {t.feedHeading}
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
            <p style={{ fontSize: 16, marginBottom: 8 }}>{t.noIdeasYet}</p>
            <p style={{ fontSize: 14 }}>{t.beFirstToPost}</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} authed={!!user} t={t} ct={ct} />
            ))}
          </ul>
        )}
      </main>

      <footer
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          color: '#bdbdb7',
          fontSize: 12.5,
          padding: 24,
        }}
      >
        <LanguageSwitcher current={locale} locales={LOCALES} inline />
        <span>{t.footer}</span>
      </footer>
    </>
  )
}
