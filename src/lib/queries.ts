/**
 * Shared DB query helpers — all synchronous (better-sqlite3).
 * Import only in server components / route handlers.
 */
import { db } from '@/lib/db'

export interface IdeaImage {
  id: number
  url: string
  position: number
}

export interface ReactionCount {
  emoji: string
  count: number
  /** whether the current user has this reaction */
  reacted: boolean
}

export interface IdeaRow {
  id: number
  body: string
  created_at: string
  author_id: number
  username: string | null
  display_name: string | null
  avatar_url: string | null
  score: number
  comment_count: number
  user_vote: number | null // +1 | -1 | null
  archived: boolean
  images: IdeaImage[]
  reactions: ReactionCount[]
}

/**
 * Fetch feed ideas — score DESC, created_at DESC.
 * If userId is provided, includes that user's vote state and reaction state.
 */
export function getFeedIdeas(userId: number | null): IdeaRow[] {
  const rows = db
    .prepare(
      `SELECT
        i.id,
        i.body,
        i.created_at,
        i.author_id,
        u.username,
        u.display_name,
        u.avatar_url,
        COALESCE(SUM(v.value), 0) AS score,
        COUNT(DISTINCT c.id)      AS comment_count,
        uv.value                  AS user_vote
       FROM ideas i
       JOIN users u ON u.id = i.author_id
       LEFT JOIN votes v ON v.idea_id = i.id
       LEFT JOIN comments c ON c.idea_id = i.id
       LEFT JOIN votes uv ON uv.idea_id = i.id AND uv.user_id = ?
       WHERE i.id NOT IN (SELECT idea_id FROM idea_archive_log)
       GROUP BY i.id
       ORDER BY score DESC, i.created_at DESC`,
    )
    .all(userId ?? -1) as Array<{
    id: number
    body: string
    created_at: string
    author_id: number
    username: string | null
    display_name: string | null
    avatar_url: string | null
    score: number
    comment_count: number
    user_vote: number | null
  }>

  return rows.map((row) => ({
    ...row,
    archived: false,
    images: getIdeaImages(row.id),
    reactions: getIdeaReactions(row.id, userId),
  }))
}

export function getIdeaById(id: number, userId: number | null): IdeaRow | null {
  const row = db
    .prepare(
      `SELECT
        i.id,
        i.body,
        i.created_at,
        i.author_id,
        u.username,
        u.display_name,
        u.avatar_url,
        COALESCE(SUM(v.value), 0) AS score,
        COUNT(DISTINCT c.id)      AS comment_count,
        uv.value                  AS user_vote,
        (al.idea_id IS NOT NULL)  AS archived
       FROM ideas i
       JOIN users u ON u.id = i.author_id
       LEFT JOIN votes v ON v.idea_id = i.id
       LEFT JOIN comments c ON c.idea_id = i.id
       LEFT JOIN votes uv ON uv.idea_id = i.id AND uv.user_id = ?
       LEFT JOIN idea_archive_log al ON al.idea_id = i.id
       WHERE i.id = ?
       GROUP BY i.id`,
    )
    .get(userId ?? -1, id) as
    | {
        id: number
        body: string
        created_at: string
        author_id: number
        username: string | null
        display_name: string | null
        avatar_url: string | null
        score: number
        comment_count: number
        user_vote: number | null
        archived: number
      }
    | undefined

  if (!row) return null

  return {
    ...row,
    archived: !!row.archived,
    images: getIdeaImages(row.id),
    reactions: getIdeaReactions(row.id, userId),
  }
}

export function getIdeaImages(ideaId: number): IdeaImage[] {
  return db
    .prepare('SELECT id, url, position FROM idea_images WHERE idea_id = ? ORDER BY position ASC')
    .all(ideaId) as IdeaImage[]
}

export function getIdeaReactions(ideaId: number, userId: number | null): ReactionCount[] {
  const rows = db
    .prepare(
      `SELECT emoji, COUNT(*) AS count FROM reactions WHERE idea_id = ? GROUP BY emoji ORDER BY count DESC`,
    )
    .all(ideaId) as Array<{ emoji: string; count: number }>

  if (!rows.length) return []

  const userReacted = userId
    ? (
        db
          .prepare('SELECT emoji FROM reactions WHERE idea_id = ? AND user_id = ?')
          .all(ideaId, userId) as Array<{ emoji: string }>
      ).map((r) => r.emoji)
    : []

  return rows.map((r) => ({
    emoji: r.emoji,
    count: r.count,
    reacted: userReacted.includes(r.emoji),
  }))
}

export interface CommentRow {
  id: number
  body: string
  created_at: string
  author_id: number
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

export function getIdeaComments(ideaId: number): CommentRow[] {
  return db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.author_id,
              u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.idea_id = ?
       ORDER BY c.created_at ASC`,
    )
    .all(ideaId) as CommentRow[]
}
