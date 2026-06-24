import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'

/**
 * POST /api/ideas/[id]/comments
 * Body: { body: string }
 *
 * Inserts a comment. Returns { id, created_at }.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ideaId = parseInt(params.id, 10)
  if (isNaN(ideaId)) return NextResponse.json({ error: 'Invalid idea id' }, { status: 400 })

  // Verify idea exists
  const idea = db.prepare('SELECT id FROM ideas WHERE id = ?').get(ideaId)
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })

  let body: { body?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const text = body.body?.trim()
  if (!text || text.length < 1) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 })
  }

  const result = db
    .prepare(
      `INSERT INTO comments (idea_id, author_id, body, created_at) VALUES (?, ?, ?, datetime('now'))`,
    )
    .run(ideaId, user.id, text)

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 })
}
