'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductGallery from './ProductGallery'
import ProductActions from './ProductActions'

const responsiveStyles = `
  .image-container-responsive {
    width: calc(100vw - 120px);
    margin-left: calc(-50vw + 50% + 55px);
    margin-bottom: 24px;
  }
  
  @media (min-width: 1200px) {
    .image-container-responsive {
      width: calc(100vw - 160px);
      margin-left: calc(-50vw + 50% + 75px);
    }
  }
  
  @media (max-width: 768px) {
    .image-container-responsive {
      width: 90%;
      margin-left: auto;
      margin-right: auto;
      position: relative;
      left: 0;
    }
  }
`

export default function ProductDetailClient({ product, images, priceKsh, status, mergedMeta }) {
  const [popupState, setPopupState] = useState({ show: false, action: null })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePopupStateChange = (newState) => {
    setPopupState(newState)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      <main style={{ paddingTop: '40px' }}>
        <article className="product-detail">
          {/* Responsive image gallery */}
          <div className="image-container-responsive">
            <ProductGallery images={images} name={product.name} popupState={popupState} />
          </div>
        
        {/* Contained product info */}
        <div style={{ maxWidth: '1400px', width: '90%', margin: '0 auto' }}>
          <div className="info product-info-grid" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 8, padding: 8, marginBottom: 12 }}>
            
            {/* Title */}
            <div style={{ marginBottom: '8px' }}>
              <h1 className="product-title">{product.name}</h1>
            </div>

            {/* Subtitle/Meta */}
            <ul className="detail-meta-grid">
              {mergedMeta.split(/[|,]/).map(s => s.trim()).filter(Boolean).map((spec, i) => (
                <li key={i} className="detail-meta-item">
                  <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>

            {/* Price */}
            <div className="price">{priceKsh}</div>

            {/* Action Buttons */}
            <div className="actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <ProductActions product={product} onPopupStateChange={handlePopupStateChange} />
              <a className="btn" href="#contact" style={{ padding: '8px 14px', fontSize: '13px', fontWeight: '600' }}>Contact Details</a>
              <Link href="/" className="back-arrow-btn" style={{ fontSize: '20px' }}>↩</Link>
            </div>

            {/* Features/Highlights Section */}
            <div className="product-features">
              <ul className="product-features-list">
                {String(product.details || '').split(/[\n•-]/).map(s => s.trim()).filter(Boolean).map((feature, i) => (
                  <li key={i}>
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            
          </div>
        </div>
      </article>
    </main>
    </>
  )
}
