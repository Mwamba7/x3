'use client'

import { useState, useEffect, useMemo } from 'react'

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

export default function ProductGallery({ images = [], name, popupState, coverImageIndex = 0, mainImage = null, condition = '', status = 'available', isSold = false }) {
  const [active, setActive] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  // Use mainImage as first image if provided, otherwise use reordered images
  const galleryImages = useMemo(() => {
    // More strict filtering to remove ALL invalid images
    const isValidImage = (img) => {
      return img && 
             typeof img === 'string' && 
             img.trim() !== '' && 
             img !== 'null' && 
             img !== 'undefined' &&
             !img.includes('data:,'); // Remove empty data URLs
    }
    
    const validImages = (images || []).filter(isValidImage)
    
    // If no valid images, return empty array to prevent blank images
    if (validImages.length === 0) {
      return []
    }
    
    if (mainImage && isValidImage(mainImage)) {
      // Check if mainImage is already in the images array
      const mainImageIndex = validImages.indexOf(mainImage)
      
      if (mainImageIndex === 0) {
        // mainImage is already first, return as-is
        return validImages
      } else if (mainImageIndex > 0) {
        // mainImage is in the array but not first, move it to front
        const result = [...validImages]
        const [mainImg] = result.splice(mainImageIndex, 1)
        result.unshift(mainImg)
        return result
      } else {
        // mainImage is not in the array, add it first
        return [mainImage, ...validImages]
      }
    }
    
    // Fallback to reordering logic
    if (validImages.length <= 1) return validImages
    
    const imageArray = [...validImages]
    if (coverImageIndex > 0 && coverImageIndex < imageArray.length) {
      // Move cover image to first position
      const [coverImage] = imageArray.splice(coverImageIndex, 1)
      imageArray.unshift(coverImage)
    }
    return imageArray
  }, [images, coverImageIndex, mainImage])
  
  // Use galleryImages for display
  const list = galleryImages || []
  const main = list[active] || list[0]
  
  // Reset active image when images change and handle mounting
  useEffect(() => {
    setActive(0)
    setMounted(true)
  }, [galleryImages])

  // Debug: Log images to console (remove in production)
  if (images.length > 1) {
    console.log('ProductGallery: Multiple images detected', { 
      count: images.length, 
      coverImageIndex,
      mainImage,
      originalImages: images.slice(0, 3),
      galleryImages: galleryImages.slice(0, 3),
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
          <>
            <img
              src={main}
              alt={name}
              className="product-gallery-image"
              onError={(e) => {
                console.error('Image failed to load:', main);
                e.target.style.display = 'none';
              }}
            />
            {/* Badges */}
            {condition && (
              <span className="badge condition">{condition}</span>
            )}
            <span className={`badge ${isSold ? 'sold-badge' : ''}`}>
              {isSold ? 'Sold' : 'Available'}
            </span>
          </>
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
        {mounted && popupState && popupState.id && (
          <div className="cart-popup" data-action={popupState.action} style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.3s ease'
          }}>
            {popupState.action === 'added' ? '✓ Added to Cart!' : '✓ Removed from Cart!'}
          </div>
        )}
      </div>

      {/* Horizontal thumbnails with snap scroll */}
      {list.length > 1 && (
        <div className="thumbs" style={{ width: '100%', maxWidth: '100%', display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(72px, 88px)', gap: 8, overflowX: 'auto', paddingBottom: 3, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', margin: '0 auto' }}>
          {list.map((src, i) => {
            // Additional safety check - don't render if src is invalid
            if (!src || src.trim() === '' || src === 'null' || src === 'undefined') {
              return null
            }
            
            return (
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
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
