import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { isOwner } from '@/lib/auth/owner'
import { db } from '@/lib/db'

/**
 * POST /api/ideas/[id]/archive
 * Body: { archived: boolean }
 *
 * Owner-only (see isOwner). Archiving hides an idea from the feed without
 * deleting it — direct links (e.g. old Telegram notifications) still work.
 * Returns { archived: boolean }.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isOwner(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ideaId = parseInt(params.id, 10)
  if (isNaN(ideaId)) return NextResponse.json({ error: 'Invalid idea id' }, { status: 400 })

  const idea = db.prepare('SELECT id FROM ideas WHERE id = ?').get(ideaId)
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  let body: { archived?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.archived) {
    db.prepare(
      `INSERT INTO idea_archive_log (idea_id, archived_by, archived_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT (idea_id) DO NOTHING`,
    ).run(ideaId, user.id)
  } else {
    db.prepare('DELETE FROM idea_archive_log WHERE idea_id = ?').run(ideaId)
  }

  return NextResponse.json({ archived: !!body.archived })
}
