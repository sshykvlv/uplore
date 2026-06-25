/**
 * Uplore brand mark — a white up-arrow inside an ember circle.
 * Server-safe (no client hooks). Size in px.
 */
export default function BrandMark({ size = 22 }: { size?: number }) {
  const g = Math.round(size * 0.62)
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(150deg,#ff7a45,#e8602c)',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 2px 8px rgba(232,96,44,.35)',
        flexShrink: 0,
      }}
      aria-hidden
    >
      <svg width={Math.round(g * 0.72)} height={g} viewBox="0 0 18 20" fill="none">
        <path
          d="M9 17V4M9 4L4 9M9 4L14 9"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
