import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

/**
 * POST /api/ideas/[id]/vote
 * Body: { value: 1 | -1 | 0 }
 *
 * - value 1 or -1 → upsert vote
 * - value 0 or same direction as existing → remove vote (toggle off)
 * Returns: { score: number, userVote: number | null }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ideaId = parseInt(params.id, 10)
  if (isNaN(ideaId)) return NextResponse.json({ error: 'Invalid idea id' }, { status: 400 })

  let body: { value?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const incoming = body.value
  if (incoming !== 1 && incoming !== -1 && incoming !== 0) {
    return NextResponse.json({ error: 'value must be 1, -1, or 0' }, { status: 400 })
  }

  // Check existing vote
  const existing = db
    .prepare('SELECT value FROM votes WHERE idea_id = ? AND user_id = ?')
    .get(ideaId, user.id) as { value: number } | undefined

  let finalValue: number | null

  if (incoming === 0) {
    // Explicit remove
    finalValue = null
  } else if (existing && existing.value === incoming) {
    // Same direction → toggle off
    finalValue = null
  } else {
    finalValue = incoming
  }

  if (finalValue === null) {
    db.prepare('DELETE FROM votes WHERE idea_id = ? AND user_id = ?').run(ideaId, user.id)
  } else {
    db.prepare(
      `INSERT INTO votes (idea_id, user_id, value, created_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT (idea_id, user_id) DO UPDATE SET value = excluded.value, created_at = excluded.created_at`,
    ).run(ideaId, user.id, finalValue)
  }

  const { score } = db
    .prepare('SELECT COALESCE(SUM(value), 0) AS score FROM votes WHERE idea_id = ?')
    .get(ideaId) as { score: number }

  return NextResponse.json({ score, userVote: finalValue })
}
