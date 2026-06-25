import Link from 'next/link'
import VoteCapsule from '@/components/VoteCapsule'
import ReactionChips from '@/components/ReactionChips'
import ImageRow from '@/components/ImageRow'
import { relativeTime } from '@/lib/time'
import type { IdeaRow } from '@/lib/queries'
import type { Dict, ClientDict } from '@/lib/i18n/dictionaries'

interface IdeaCardProps {
  idea: IdeaRow
  authed: boolean
  /** Full dict for server-rendered strings (relativeTime) */
  t: Dict
  /** Serializable client dict for client sub-components */
  ct: ClientDict
}

function authorLabel(idea: IdeaRow): string {
  const name = idea.display_name ?? idea.username
  if (!name) return '@unknown'
  return name.startsWith('@') ? name : `@${name}`
}

export default function IdeaCard({ idea, authed, t, ct }: IdeaCardProps) {
  return (
    <li
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        marginBottom: 10,
        transition: '.15s',
      }}
    >
      <VoteCapsule
        ideaId={idea.id}
        initialScore={idea.score}
        initialUserVote={idea.user_vote}
        authed={authed}
      />

      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <Link href={`/idea/${idea.id}`} style={{ display: 'block' }}>
          <p
            style={{
              fontSize: '15.5px',
              color: 'var(--ink)',
              letterSpacing: '-0.005em',
              lineHeight: 1.45,
            }}
          >
            {idea.body}
          </p>
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: 'var(--muted)',
            marginTop: 11,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 550, color: '#6f6f69' }}>{authorLabel(idea)}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cfcfca', flexShrink: 0 }} />
          <span>{relativeTime(idea.created_at, t.time)}</span>
          <Link href={`/idea/${idea.id}`} className="comment-link" style={{ marginLeft: 'auto' }}>
            💬 {idea.comment_count}
          </Link>
        </div>

        <ReactionChips
          ideaId={idea.id}
          initialReactions={idea.reactions}
          authed={authed}
          t={ct}
        />
      </div>

      {idea.images.length > 0 && <ImageRow images={idea.images} />}
    </li>
  )
}
