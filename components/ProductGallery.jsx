'use client'

import { useState } from 'react'

export default function ProductGallery({ images = [], name }) {
  const [list] = useState(images)
  const [active, setActive] = useState(0)
  const main = list[active] || list[0]

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Main image */}
      <div className="gallery-box" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', maxHeight: '60vh', borderRadius: 14, overflow: 'hidden', background: '#0e1421', margin: '0 auto' }}>
        {main && (<img src={main} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />)}
      </div>

      {/* Horizontal thumbnails with snap scroll */}
      {list.length > 1 && (
        <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(60px, 80px)', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              style={{
                position: 'relative',
                aspectRatio: '4 / 3',
                borderRadius: 10,
                overflow: 'hidden',
                border: i === active ? '2px solid var(--primary)' : '1px solid #253049',
                padding: 0,
                cursor: 'pointer',
                background: 'transparent',
                scrollSnapAlign: 'start',
              }}
            >
              <img src={src} alt={`${name} thumbnail ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
