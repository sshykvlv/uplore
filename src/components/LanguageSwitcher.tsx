'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale, LocaleMeta } from '@/lib/i18n/dictionaries'

interface LanguageSwitcherProps {
  current: Locale
  locales: LocaleMeta[]
  /** compact=true → only the 2-letter code shown (for gate/login screens) */
  compact?: boolean
  /** inline=true → ultra-compact "EN · RU · UK · PL" row (for the footer) */
  inline?: boolean
}

export default function LanguageSwitcher({
  current,
  locales,
  compact = false,
  inline = false,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function select(code: Locale) {
    document.cookie = `locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setOpen(false)
    router.refresh()
  }

  // Ultra-compact inline row: EN · RU · UK · PL — meant for the footer.
  if (inline) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
        }}
      >
        {locales.map((l, i) => (
          <span key={l.code} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: '#d8d8d2' }}>·</span>}
            <button
              onClick={() => select(l.code)}
              aria-current={l.code === current}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px 1px',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: l.code === current ? 650 : 500,
                color: l.code === current ? 'var(--accent)' : 'var(--muted)',
                transition: '.12s',
              }}
              onMouseEnter={(e) => {
                if (l.code !== current) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'
              }}
              onMouseLeave={(e) => {
                if (l.code !== current) (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
              }}
            >
              {l.badge}
            </button>
          </span>
        ))}
      </div>
    )
  }

  const currentLabel = locales.find((l) => l.code === current)?.label ?? current.toUpperCase()

  const triggerLabel = compact
    ? current.toUpperCase()
    : currentLabel

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        style={{
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          fontWeight: 550,
          padding: '0 11px',
          borderRadius: 9999,
          border: '1px solid var(--line)',
          background: open ? 'var(--accent-soft)' : 'var(--card)',
          color: open ? 'var(--accent)' : 'var(--muted)',
          cursor: 'pointer',
          transition: '.13s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 14 }}>🌐</span>
        {triggerLabel}
        <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 1 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,.1)',
            overflow: 'hidden',
            minWidth: 140,
            zIndex: 200,
          }}
        >
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: l.code === current ? 650 : 450,
                background: l.code === current ? 'var(--accent-soft)' : 'none',
                color: l.code === current ? 'var(--accent)' : 'var(--ink)',
                border: 'none',
                cursor: 'pointer',
                transition: '.1s',
              }}
              onMouseEnter={(e) => {
                if (l.code !== current)
                  (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f3'
              }}
              onMouseLeave={(e) => {
                if (l.code !== current)
                  (e.currentTarget as HTMLButtonElement).style.background = 'none'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
