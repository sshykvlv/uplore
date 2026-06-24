import Link from 'next/link'
import VoteCapsule from '@/components/VoteCapsule'
import ReactionChips from '@/components/ReactionChips'
import ImageRow from '@/components/ImageRow'
import { relativeTime } from '@/lib/time'
import type { IdeaRow } from '@/lib/queries'

interface IdeaCardProps {
  idea: IdeaRow
  authed: boolean
}

function authorLabel(idea: IdeaRow): string {
  const name = idea.display_name ?? idea.username
  if (!name) return '@unknown'
  return name.startsWith('@') ? name : `@${name}`
}

export default function IdeaCard({ idea, authed }: IdeaCardProps) {
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
      {/* Vote capsule — client component */}
      <VoteCapsule
        ideaId={idea.id}
        initialScore={idea.score}
        initialUserVote={idea.user_vote}
        authed={authed}
      />

      {/* Body */}
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

        {/* Meta row */}
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
          <span
            style={{ width: 3, height: 3, borderRadius: '50%', background: '#cfcfca', flexShrink: 0 }}
          />
          <span>{relativeTime(idea.created_at)}</span>
          <span
            style={{ width: 3, height: 3, borderRadius: '50%', background: '#cfcfca', flexShrink: 0 }}
          />
          <Link
            href={`/idea/${idea.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            💬 {idea.comment_count}
          </Link>
        </div>

        {/* Reaction chips — client component */}
        <ReactionChips
          ideaId={idea.id}
          initialReactions={idea.reactions}
          authed={authed}
        />
      </div>

      {/* Right-side image row */}
      {idea.images.length > 0 && <ImageRow images={idea.images} />}
    </li>
  )
}
