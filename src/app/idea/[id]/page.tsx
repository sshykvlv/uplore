import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { getIdeaById, getIdeaComments } from '@/lib/queries'
import Header from '@/components/Header'
import VoteCapsule from '@/components/VoteCapsule'
import ReactionChips from '@/components/ReactionChips'
import ImageGallery from '@/components/ImageGallery'
import AddCommentForm from '@/components/AddCommentForm'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Avatar from '@/components/Avatar'
import { relativeTime } from '@/lib/time'
import { authorLabel } from '@/lib/author'
import { getDict, getClientDict, getLocale, LOCALES } from '@/lib/i18n/locale'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const id = parseInt(params.id, 10)
  if (isNaN(id)) notFound()

  const user = await getSession()
  const idea = getIdeaById(id, user?.id ?? null)
  if (!idea) notFound()

  const comments = getIdeaComments(id)
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
          padding: '10px 16px 60px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--muted)',
            marginBottom: 20,
            padding: '4px 0',
          }}
        >
          {t.backToFeed}
        </Link>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            padding: '20px 22px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <VoteCapsule
              ideaId={idea.id}
              initialScore={idea.score}
              initialUserVote={idea.user_vote}
              authed={!!user}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 17,
                  color: 'var(--ink)',
                  letterSpacing: '-0.005em',
                  lineHeight: 1.5,
                  fontWeight: 450,
                }}
              >
                {idea.body}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  color: 'var(--muted)',
                  marginTop: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontWeight: 550, color: '#6f6f69' }}>
                  {authorLabel(idea.username, idea.display_name)}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cfcfca', flexShrink: 0 }} />
                <span>{relativeTime(idea.created_at, t.time)}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cfcfca', flexShrink: 0 }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  💬 {idea.comment_count}
                </span>
              </div>

              <ReactionChips
                ideaId={idea.id}
                initialReactions={idea.reactions}
                authed={!!user}
                t={ct}
              />
            </div>
          </div>

          <ImageGallery images={idea.images} />
        </div>

        <section>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              marginBottom: 16,
            }}
          >
            {t.commentsHeading(comments.length)}
          </h2>

          {comments.length === 0 && (
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
              {t.noCommentsYet}
            </p>
          )}

          <ul style={{ listStyle: 'none' }}>
            {comments.map((c) => (
              <li
                key={c.id}
                style={{
                  borderBottom: '1px solid var(--line)',
                  padding: '14px 0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                    fontSize: 13,
                    color: 'var(--muted)',
                  }}
                >
                  <Avatar avatarUrl={c.avatar_url} name={c.display_name ?? c.username} size={28} />
                  <span style={{ fontWeight: 550, color: '#6f6f69' }}>
                    {authorLabel(c.username, c.display_name)}
                  </span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cfcfca', flexShrink: 0 }} />
                  <span>{relativeTime(c.created_at, t.time)}</span>
                </div>
                <p style={{ fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.5 }}>{c.body}</p>
              </li>
            ))}
          </ul>

          <AddCommentForm ideaId={idea.id} authed={!!user} t={ct} />
        </section>
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
