import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { getIdeaReactions } from '@/lib/queries'

const ALLOWED_EMOJIS = ['🔥', '🙌', '👀', '💯', '🚀', '👍', '❤️', '😄']

/**
 * POST /api/ideas/[id]/react
 * Body: { emoji: string }
 *
 * Toggles reaction — inserts if absent, deletes if present.
 * Returns: { reactions: ReactionCount[] }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ideaId = parseInt(params.id, 10)
  if (isNaN(ideaId)) return NextResponse.json({ error: 'Invalid idea id' }, { status: 400 })

  let body: { emoji?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const emoji = body.emoji?.trim()
  if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
  }

  const existing = db
    .prepare('SELECT 1 FROM reactions WHERE idea_id = ? AND user_id = ? AND emoji = ?')
    .get(ideaId, user.id, emoji)

  if (existing) {
    db.prepare('DELETE FROM reactions WHERE idea_id = ? AND user_id = ? AND emoji = ?').run(
      ideaId,
      user.id,
      emoji,
    )
  } else {
    db.prepare(
      `INSERT INTO reactions (idea_id, user_id, emoji, created_at) VALUES (?, ?, ?, datetime('now'))`,
    ).run(ideaId, user.id, emoji)
  }

  const reactions = getIdeaReactions(ideaId, user.id)
  return NextResponse.json({ reactions })
}
