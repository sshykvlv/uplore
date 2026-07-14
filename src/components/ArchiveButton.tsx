'use client'

import { useState } from 'react'
import type { ClientDict } from '@/lib/i18n/dictionaries'

interface ArchiveButtonProps {
  ideaId: number
  initialArchived: boolean
  t: ClientDict
}

export default function ArchiveButton({ ideaId, initialArchived, t }: ArchiveButtonProps) {
  const [archived, setArchived] = useState(initialArchived)
  const [pending, setPending] = useState(false)

  async function toggle() {
    if (pending) return
    setPending(true)
    const next = !archived

    try {
      const res = await fetch(`/api/ideas/${ideaId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: next }),
      })
      if (res.ok) setArchived(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 28,
        padding: '0 12px',
        borderRadius: 9999,
        border: '1px solid var(--line)',
        background: 'var(--card)',
        color: 'var(--muted)',
        fontSize: 12.5,
        fontWeight: 500,
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.6 : 1,
      }}
    >
      {archived ? t.unarchiveIdea : t.archiveIdea}
    </button>
  )
}
