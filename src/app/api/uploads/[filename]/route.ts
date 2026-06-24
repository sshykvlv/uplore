import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import fs from 'fs'

const UPLOADS_PATH = process.env.UPLOADS_PATH ?? './uploads'

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
}

/**
 * GET /api/uploads/[filename]
 * Serves uploaded image files from the UPLOADS_PATH directory.
 */
export async function GET(_req: NextRequest, { params }: { params: { filename: string } }) {
  // Sanitize — no path traversal
  const filename = path.basename(params.filename)
  const filePath = path.join(UPLOADS_PATH, filename)

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mime = MIME[ext] ?? 'application/octet-stream'

  const buffer = await readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
