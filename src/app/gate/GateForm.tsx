'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientDict } from '@/lib/i18n/dictionaries'

interface GateFormProps {
  initialCode?: string
  next: string
  t: ClientDict
}

export default function GateForm({ initialCode, next, t }: GateFormProps) {
  const [code, setCode] = useState(initialCode ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const didAutoSubmit = useRef(false)

  async function submit(value: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: value, next }),
      })
      if (res.ok) {
        router.push(next || '/')
        return
      }
      const json = await res.json().catch(() => ({}))
      setError((json as { error?: string }).error ?? t.incorrectCode)
    } catch {
      setError(t.networkErrorGate)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCode && !didAutoSubmit.current) {
      didAutoSubmit.current = true
      submit(initialCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    submit(value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="password"
          placeholder={t.teamPassword}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
          required
          autoFocus={!initialCode}
          style={{
            flex: 1,
            height: 38,
            padding: '0 14px',
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
          disabled={loading || !code.trim()}
          style={{
            height: 38,
            padding: '0 20px',
            borderRadius: 9999,
            border: '1px solid var(--accent)',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 550,
            cursor: loading ? 'wait' : 'pointer',
            opacity: !code.trim() ? 0.5 : 1,
            boxShadow: '0 2px 10px rgba(232,96,44,.25)',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '…' : t.enter}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 10, fontSize: 13, color: '#c0392b', textAlign: 'center' }}>
          {error}
        </p>
      )}

      {initialCode && !error && loading && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
          {t.verifyingLink}
        </p>
      )}
    </form>
  )
}
