'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client component — submits to /api/auth/dev, then navigates to /.
 * Only rendered when ALLOW_DEV_LOGIN=true (gated in the parent server component).
 */
export default function DevLoginForm() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6,
        }}
      >
        Dev login
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          required
          autoFocus
          style={{
            flex: 1,
            height: 36,
            padding: '0 12px',
            borderRadius: 9999,
            border: '1px solid var(--line)',
            background: 'var(--card)',
            fontSize: 14,
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 9999,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 550,
            cursor: loading ? 'wait' : 'pointer',
            opacity: !username.trim() ? 0.5 : 1,
            boxShadow: '0 2px 10px rgba(232,96,44,.25)',
          }}
        >
          {loading ? '…' : 'Go'}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 8, fontSize: 13, color: '#c0392b' }}>{error}</p>
      )}
    </form>
  )
}
