/**
 * Right-side image row — up to 3 thumbs + "+N" overflow tile.
 * Pure display component (server or client safe).
 */
interface ImageRowProps {
  images: Array<{ id: number; url: string; position: number }>
}

export default function ImageRow({ images }: ImageRowProps) {
  if (!images.length) return null

  const tileStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 7,
    overflow: 'hidden',
    flexShrink: 0,
    display: 'block',
    objectFit: 'cover',
  }

  const moreStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 7,
    display: 'grid',
    placeItems: 'center',
    background: '#efeeec',
    color: '#6f6f69',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  }

  let tiles: React.ReactNode

  if (images.length > 3) {
    tiles = (
      <>
        {images.slice(0, 2).map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={img.url.startsWith('/uploads/') ? img.url.replace('/uploads/', '/api/uploads/') : img.url}
            alt=""
            style={tileStyle}
          />
        ))}
        <div style={moreStyle}>+{images.length - 2}</div>
      </>
    )
  } else {
    tiles = images.map((img) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={img.id}
        src={img.url.startsWith('/uploads/') ? img.url.replace('/uploads/', '/api/uploads/') : img.url}
        alt=""
        style={tileStyle}
      />
    ))
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 4,
        flexShrink: 0,
        marginTop: 1,
        alignSelf: 'flex-start',
      }}
    >
      {tiles}
    </div>
  )
}
