'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface NewIdeaModalProps {
  authed: boolean
}

export default function NewIdeaModal({ authed }: NewIdeaModalProps) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function openModal() {
    if (!authed) {
      window.location.href = '/login'
      return
    }
    setOpen(true)
  }

  function closeModal() {
    if (submitting) return
    setOpen(false)
    setBody('')
    setFiles([])
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || body.trim().length < 3) {
      setError('Idea must be at least 3 characters.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const fd = new FormData()
      fd.append('body', body.trim())
      for (const f of files) fd.append('images', f)

      const res = await fetch('/api/ideas', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to post idea.')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      setOpen(false)
      setBody('')
      setFiles([])
      router.refresh()
      // Scroll to top to see the new idea
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Navigate to the new idea detail
      router.push(`/idea/${data.id}`)
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  return (
    <>
      {/* "+ New idea" button */}
      <button
        onClick={openModal}
        style={{
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 14,
          fontWeight: 550,
          padding: '0 16px',
          borderRadius: 9999,
          border: '1px solid var(--accent)',
          background: 'var(--accent)',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(232,96,44,.3)',
          transition: '.15s',
        }}
      >
        + New idea
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.35)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Modal panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: 520,
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 650,
                letterSpacing: '-0.02em',
                marginBottom: 16,
                color: 'var(--ink)',
              }}
            >
              New idea
            </h2>

            <form onSubmit={handleSubmit}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your idea in 1–2 sentences…"
                maxLength={1000}
                rows={4}
                autoFocus
                style={{
                  width: '100%',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 15,
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {body.length}/1000
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    borderRadius: 8,
                    transition: '.13s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  📎 {files.length > 0 ? `${files.length} image${files.length > 1 ? 's' : ''} selected` : 'Attach images'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexWrap: 'wrap',
                    marginBottom: 16,
                  }}
                >
                  {files.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        border: '1px solid #f3b79b',
                        borderRadius: 8,
                        padding: '2px 8px',
                      }}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              )}

              {error && (
                <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    height: 36,
                    padding: '0 16px',
                    borderRadius: 9999,
                    border: '1px solid var(--line)',
                    background: '#fff',
                    fontSize: 14,
                    fontWeight: 550,
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !body.trim()}
                  style={{
                    height: 36,
                    padding: '0 20px',
                    borderRadius: 9999,
                    border: '1px solid var(--accent)',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 550,
                    cursor: submitting || !body.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !body.trim() ? 0.6 : 1,
                    boxShadow: '0 2px 10px rgba(232,96,44,.3)',
                    transition: '.15s',
                  }}
                >
                  {submitting ? 'Posting…' : 'Post idea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
