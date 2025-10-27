'use client'

import { useState, useEffect } from 'react'

const galleryStyles = `
  .product-gallery-image {
    max-width: 100%;
    max-height: 90vh;
    width: 100%;
    height: 40vh;
    object-fit: contain;
    display: block;
    filter: brightness(1.05) contrast(1.08) saturate(1.06);
  }
  
  @media (max-width: 768px) {
    .product-gallery-image {
      height: 50vh;
      object-fit: cover;
    }
  }
  
  @media (max-width: 480px) {
    .product-gallery-image {
      height: 45vh;
      object-fit: cover;
    }
  }
`

export default function ProductGallery({ images = [], name, popupState }) {
  const [active, setActive] = useState(0)
  const [mounted, setMounted] = useState(false)
  // Use images directly instead of storing in state to ensure updates
  const list = images || []
  const main = list[active] || list[0]
  
  // Reset active image when images change and handle mounting
  useEffect(() => {
    setActive(0)
    setMounted(true)
  }, [images])

  // Debug: Log images to console (remove in production)
  if (images.length > 1) {
    console.log('ProductGallery: Multiple images detected', { 
      count: images.length, 
      images: images.slice(0, 3), // Show first 3 URLs
      mainImage: main 
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: galleryStyles }} />
      <div style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
        {/* Main image */}
        <div
        className="gallery-box"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          maxHeight: '90vh',
          borderRadius: 5,
          overflow: 'hidden',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {main ? (
          <img
            src={main}
            alt={name}
            className="product-gallery-image"
            onError={(e) => {
              console.error('Image failed to load:', main);
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '40vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a2332',
            color: '#888',
            fontSize: '18px',
            borderRadius: '8px'
          }}>
            📷 No Image Available
          </div>
        )}
        
        {/* Action Popup - positioned at bottom center of image */}
        {mounted && popupState && popupState.show && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: popupState.action === 'added' ? 'rgba(10, 16, 26, 0.85)' : '#dc3545',
            color: popupState.action === 'added' ? 'var(--primary)' : 'white',
            fontWeight: '600',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '8px',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            {popupState.action === 'added' ? '✓ Added to Cart!' : '✓ Removed from Cart!'}
          </div>
        )}
      </div>

      {/* Horizontal thumbnails with snap scroll */}
      {list.length > 1 && (
        <div className="thumbs" style={{ width: '100%', maxWidth: '100%', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(72px, 88px)', gap: 8, overflowX: 'auto', paddingBottom: 3, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', margin: '0 auto' }}>
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
              <img 
                src={src} 
                alt={`${name} thumbnail ${i + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  console.error('Thumbnail failed to load:', src);
                  e.target.style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
    </>
  )
}
