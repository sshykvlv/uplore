'use client'

import { useState } from 'react'

const UP_SVG = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M6.5 11V2M6.5 2L3 5.5M6.5 2L10 5.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const DN_SVG = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path
      d="M6.5 2V11M6.5 11L3 7.5M6.5 11L10 7.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface VoteCapsuleProps {
  ideaId: number
  initialScore: number
  initialUserVote: number | null
  authed: boolean
}

export default function VoteCapsule({
  ideaId,
  initialScore,
  initialUserVote,
  authed,
}: VoteCapsuleProps) {
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [pending, setPending] = useState(false)

  async function handleVote(direction: 1 | -1) {
    if (!authed) {
      window.location.href = '/login'
      return
    }
    if (pending) return

    // Optimistic: same direction = toggle off, otherwise set new direction
    const newValue = userVote === direction ? 0 : direction

    // Optimistic update
    const oldScore = score
    const oldVote = userVote
    const scoreDelta = newValue - (userVote ?? 0)
    setScore(score + scoreDelta)
    setUserVote(newValue === 0 ? null : newValue)
    setPending(true)

    try {
      const res = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      })
      if (!res.ok) {
        // Revert
        setScore(oldScore)
        setUserVote(oldVote)
      } else {
        const data = await res.json()
        setScore(data.score)
        setUserVote(data.userVote)
      }
    } catch {
      setScore(oldScore)
      setUserVote(oldVote)
    } finally {
      setPending(false)
    }
  }

  const isUp = userVote === 1
  const isDown = userVote === -1

  const capsuleStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    marginTop: 2,
    padding: '3px 7px',
    borderRadius: 9999,
    border: `1px solid ${isUp ? '#f3b79b' : isDown ? '#d8d8d2' : 'var(--line)'}`,
    background: isUp ? 'var(--accent-soft)' : isDown ? '#f1f1ef' : '#fff',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.02em',
    userSelect: 'none',
    transition: '.15s',
    color: isUp ? 'var(--accent)' : isDown ? '#3a3a36' : 'var(--ink)',
    opacity: pending ? 0.7 : 1,
  }

  const upBtnStyle: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    border: 'none',
    background: 'none',
    cursor: authed ? 'pointer' : 'default',
    padding: 5,
    borderRadius: 9999,
    color: isUp ? 'var(--accent)' : 'var(--icon)',
    transition: '.12s',
    lineHeight: 0,
  }

  const dnBtnStyle: React.CSSProperties = {
    display: 'grid',
    placeItems: 'center',
    border: 'none',
    background: 'none',
    cursor: authed ? 'pointer' : 'default',
    padding: 5,
    borderRadius: 9999,
    color: isDown ? '#5f5f5a' : 'var(--icon)',
    transition: '.12s',
    lineHeight: 0,
  }

  return (
    <div style={capsuleStyle}>
      <button
        style={upBtnStyle}
        onClick={() => handleVote(1)}
        title="Upvote"
        aria-label="Upvote"
        onMouseEnter={(e) => {
          if (!isUp) (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          if (!isUp) (e.currentTarget as HTMLButtonElement).style.color = 'var(--icon)'
        }}
      >
        {UP_SVG}
      </button>
      <span style={{ minWidth: 18, textAlign: 'center' }}>{score}</span>
      <button
        style={dnBtnStyle}
        onClick={() => handleVote(-1)}
        title="Downvote"
        aria-label="Downvote"
        onMouseEnter={(e) => {
          if (!isDown) (e.currentTarget as HTMLButtonElement).style.color = '#6b6b66'
        }}
        onMouseLeave={(e) => {
          if (!isDown) (e.currentTarget as HTMLButtonElement).style.color = 'var(--icon)'
        }}
      >
        {DN_SVG}
      </button>
    </div>
  )
}
