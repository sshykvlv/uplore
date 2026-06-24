'use client'

import { useState, useRef, useEffect } from 'react'
import { analytics } from '@/lib/umami'

const EMOJI_PICKER_SET = ['🔥', '🙌', '👀', '💯', '🚀', '👍', '❤️', '😄']

interface Reaction {
  emoji: string
  count: number
  reacted: boolean
}

interface ReactionChipsProps {
  ideaId: number
  initialReactions: Reaction[]
  authed: boolean
}

export default function ReactionChips({ ideaId, initialReactions, authed }: ReactionChipsProps) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  async function toggleReaction(emoji: string) {
    if (!authed) {
      window.location.href = '/login'
      return
    }

    // Optimistic update
    const prevReactions = reactions
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji)
      if (existing) {
        const newCount = existing.count - (existing.reacted ? 1 : 0) + (existing.reacted ? 0 : 1)
        if (newCount === 0 && !existing.reacted) {
          // Shouldn't happen but guard
          return prev.filter((r) => r.emoji !== emoji)
        }
        return prev
          .map((r) =>
            r.emoji === emoji ? { ...r, reacted: !r.reacted, count: r.reacted ? r.count - 1 : r.count + 1 } : r,
          )
          .filter((r) => r.count > 0)
      } else {
        return [...prev, { emoji, count: 1, reacted: true }]
      }
    })
    setPickerOpen(false)

    try {
      const res = await fetch(`/api/ideas/${ideaId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (res.ok) {
        const data = await res.json()
        setReactions(data.reactions)
        analytics.reactionAdded(emoji)
      } else {
        setReactions(prevReactions)
      }
    } catch {
      setReactions(prevReactions)
    }
  }

  const hasReactions = reactions.length > 0
  const addLabel = hasReactions ? '＋' : 'React'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 11, flexWrap: 'wrap', position: 'relative' }}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 9999,
            border: `1px solid ${r.reacted ? '#f3b79b' : 'var(--line)'}`,
            background: r.reacted ? 'var(--accent-soft)' : '#fff',
            fontSize: 13,
            fontWeight: 600,
            color: r.reacted ? 'var(--accent)' : '#6f6f69',
            cursor: 'pointer',
            transition: '.13s',
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontSize: 14 }}>{r.emoji}</span>
          {r.count}
        </button>
      ))}

      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => {
            if (!authed) {
              window.location.href = '/login'
              return
            }
            setPickerOpen((v) => !v)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 9999,
            border: '1px solid var(--line)',
            background: '#fff',
            color: '#8a8a84',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            transition: '.13s',
          }}
          title="Add reaction"
        >
          <span style={{ fontSize: 14, filter: 'grayscale(.15)' }}>🙂</span>
          {addLabel}
        </button>

        {pickerOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: 0,
              background: '#fff',
              border: '1px solid var(--line)',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,.1)',
              padding: '8px 10px',
              display: 'flex',
              gap: 4,
              flexWrap: 'wrap',
              maxWidth: 200,
              zIndex: 50,
            }}
          >
            {EMOJI_PICKER_SET.map((emoji) => {
              const alreadyReacted = reactions.find((r) => r.emoji === emoji)?.reacted
              return (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  style={{
                    fontSize: 20,
                    background: alreadyReacted ? 'var(--accent-soft)' : 'none',
                    border: alreadyReacted ? '1px solid #f3b79b' : '1px solid transparent',
                    borderRadius: 8,
                    padding: '4px 6px',
                    cursor: 'pointer',
                    transition: '.1s',
                  }}
                  title={emoji}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
