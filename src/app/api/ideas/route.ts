import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import { notifyNewIdea } from '@/lib/notify-telegram'

const UPLOADS_PATH = process.env.UPLOADS_PATH ?? './uploads'

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH, { recursive: true })
  }
}

/**
 * POST /api/ideas
 * multipart/form-data: body (text), images[] (files, optional)
 *
 * Creates an idea and associated images.
 * Returns { id: number }
 */
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = req.headers.get('content-type') ?? ''

  let bodyText = ''
  const imageFiles: Array<{ buffer: ArrayBuffer; ext: string }> = []

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    bodyText = (formData.get('body') as string | null)?.trim() ?? ''

    const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB per image
    const MAX_IMAGES = 6

    const files = formData.getAll('images') as File[]
    if (files.filter((f) => f.size > 0).length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Too many images — maximum ${MAX_IMAGES} per idea` },
        { status: 400 },
      )
    }

    for (const file of files) {
      if (file.size === 0) continue
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Image "${file.name}" exceeds the 5 MB size limit` },
          { status: 400 },
        )
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']
      if (!allowed.includes(ext)) continue
      const buffer = await file.arrayBuffer()
      imageFiles.push({ buffer, ext })
    }
  } else {
    // JSON fallback — body only, no images
    let parsed: { body?: string }
    try {
      parsed = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    bodyText = (parsed.body ?? '').trim()
  }

  if (!bodyText || bodyText.length < 3) {
    return NextResponse.json({ error: 'Idea body is required (min 3 chars)' }, { status: 400 })
  }
  if (bodyText.length > 1000) {
    return NextResponse.json({ error: 'Idea too long (max 1000 chars)' }, { status: 400 })
  }

  // Insert idea
  const result = db
    .prepare(`INSERT INTO ideas (author_id, body, created_at) VALUES (?, ?, datetime('now'))`)
    .run(user.id, bodyText)

  const ideaId = result.lastInsertRowid as number

  // Save images
  if (imageFiles.length > 0) {
    ensureUploadsDir()

    const insertImage = db.prepare(
      `INSERT INTO idea_images (idea_id, url, position) VALUES (?, ?, ?)`,
    )

    for (let i = 0; i < imageFiles.length; i++) {
      const { buffer, ext } = imageFiles[i]
      const filename = `${ideaId}-${crypto.randomBytes(6).toString('hex')}.${ext}`
      const filePath = path.join(UPLOADS_PATH, filename)
      await writeFile(filePath, Buffer.from(buffer))
      insertImage.run(ideaId, `/uploads/${filename}`, i)
    }
  }

  void notifyNewIdea({
    id: ideaId,
    body: bodyText,
    authorName: user.display_name ?? user.username ?? 'Someone',
  })

  return NextResponse.json({ id: ideaId }, { status: 201 })
}
