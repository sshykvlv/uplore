'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { analytics } from '@/lib/umami'
import type { ClientDict } from '@/lib/i18n/dictionaries'

interface AddCommentFormProps {
  ideaId: number
  authed: boolean
  t: ClientDict
}

export default function AddCommentForm({ ideaId, authed, t }: AddCommentFormProps) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (!authed) {
    return (
      <p style={{ fontSize: 14, color: 'var(--muted)', padding: '12px 0' }}>
        <a href="/login" style={{ color: 'var(--accent)' }}>
          {t.signInToComment}
        </a>{' '}
        {t.toLeaveComment}
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t.failedToPostComment)
      } else {
        analytics.commentPosted()
        setBody('')
        router.refresh()
      }
    } catch {
      setError(t.networkError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t.commentPlaceholder}
        maxLength={2000}
        rows={3}
        style={{
          width: '100%',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 14,
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          color: 'var(--ink)',
          lineHeight: 1.5,
          background: 'var(--bg)',
          transition: '.15s',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
      />
      {error && (
        <p style={{ color: '#c0392b', fontSize: 13, marginTop: 6 }}>{error}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          style={{
            height: 34,
            padding: '0 18px',
            borderRadius: 9999,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 550,
            cursor: submitting || !body.trim() ? 'not-allowed' : 'pointer',
            opacity: submitting || !body.trim() ? 0.6 : 1,
            transition: '.15s',
          }}
        >
          {submitting ? t.postingComment : t.postComment}
        </button>
      </div>
    </form>
  )
}
