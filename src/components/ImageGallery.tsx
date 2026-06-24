'use client'

import { useState } from 'react'
import type { IdeaImage } from '@/lib/queries'

interface ImageGalleryProps {
  images: IdeaImage[]
}

function imgSrc(url: string): string {
  return url.startsWith('/uploads/') ? url.replace('/uploads/', '/api/uploads/') : url
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (!images.length) return null

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginTop: 20,
        }}
      >
        {images.map((img, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={imgSrc(img.url)}
            alt={`Image ${idx + 1}`}
            onClick={() => setLightbox(idx)}
            style={{
              width: 120,
              height: 120,
              objectFit: 'cover',
              borderRadius: 10,
              cursor: 'pointer',
              border: '1px solid var(--line)',
              transition: '.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.85)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,.15)',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              borderRadius: '50%',
              width: 40,
              height: 40,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            ×
          </button>

          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1) }}
              style={{
                position: 'absolute',
                left: 20,
                background: 'rgba(255,255,255,.15)',
                border: 'none',
                color: '#fff',
                fontSize: 20,
                borderRadius: '50%',
                width: 40,
                height: 40,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc(images[lightbox].url)}
            alt={`Image ${lightbox + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,.5)',
            }}
          />

          {lightbox < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1) }}
              style={{
                position: 'absolute',
                right: 20,
                background: 'rgba(255,255,255,.15)',
                border: 'none',
                color: '#fff',
                fontSize: 20,
                borderRadius: '50%',
                width: 40,
                height: 40,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  )
}
