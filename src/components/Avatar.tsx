'use client'

import { useState } from 'react'

interface AvatarProps {
  avatarUrl: string | null
  name: string | null
  size?: number
}

function initials(name: string | null): string {
  if (!name) return '?'
  return (
    name
      .replace(/^@/, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

/**
 * Avatar with a guaranteed-filled circle.
 *
 * Telegram photo URLs are often missing or hotlink-blocked; a bare <img> then
 * collapses to an empty 32px box that reads as a layout gap next to the
 * sign-out button. Here the initials circle is always present underneath, and
 * the image is only shown once it has actually loaded — if it errors, the
 * initials remain. No empty slot, ever.
 */
export default function Avatar({ avatarUrl, name, size = 32 }: AvatarProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showImg = avatarUrl && !failed

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#d8d8d4',
        display: 'grid',
        placeItems: 'center',
        fontSize: size * 0.38,
        fontWeight: 600,
        color: '#666',
        flexShrink: 0,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {!loaded && <span>{initials(name)}</span>}
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name ?? 'avatar'}
          width={size}
          height={size}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth > 1) setLoaded(true)
            else setFailed(true)
          }}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: size,
            height: size,
            borderRadius: '50%',
            display: loaded ? 'block' : 'none',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  )
}
