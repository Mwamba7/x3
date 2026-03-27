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
            <ProductGallery 
              images={images} 
              name={product.name} 
              popupState={popupState} 
              mainImage={product.img}
            />
          </div>
        
        {/* Contained product info */}
        <div style={{ maxWidth: '1400px', width: '90%', margin: '0 auto', marginBottom: '20px' }}>
          <div className="info product-info-grid" style={{ background: 'var(--card)', border: '1px solid #253049', borderRadius: 8, padding: 8, marginBottom: 12 }}>
            
            {/* Title */}
            <div style={{ marginBottom: '8px' }}>
              <h1 className="product-title">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="price">{priceKsh}</div>

            {/* Action Buttons */}
            <div className="actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <ProductActions product={product} onPopupStateChange={handlePopupStateChange} />
              <div style={{ display: 'flex', gap: '4px' }}>
                <a 
                  href={`https://wa.me/${product.adminContact ? product.adminContact.replace(/[^\d]/g, '') : '254718176584'}?text=Hi! I'm interested in ${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '18px', 
                    color: 'var(--text)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  title="Contact via WhatsApp"
                  onMouseEnter={(e) => e.target.style.color = '#25D366'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
                <a 
                  href={`tel:${product.adminContact || '+254718176584'}`}
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '18px', 
                    color: 'var(--text)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  title="Call now"
                  onMouseEnter={(e) => e.target.style.color = '#10b981'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text)'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                </a>
              </div>
              <Link href="/" className="back-arrow-btn" style={{ fontSize: '20px' }}>↩</Link>
            </div>

            {/* Features/Highlights Section - Line by Line Display */}
            <div className="product-features" style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: 'var(--text)' }}>Specifications</h4>
              <ul className="product-features-list" style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '4px'
              }}>
                {String(product.description || product.meta || '').split(/[\n•-]/).map(s => s.trim()).filter(Boolean).map((feature, i) => (
                  <li key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '6px',
                    fontSize: '13px',
                    color: 'var(--muted)',
                    lineHeight: '1.3',
                    padding: '2px 0'
                  }}>
                    <svg className="icon" viewBox="0 0 20 20" fill="currentColor" style={{ 
                      color: 'var(--primary)', 
                      width: '12px', 
                      height: '12px', 
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span style={{ wordBreak: 'break-word' }}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Product Information */}
            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: 'var(--background-secondary)', borderRadius: '6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '12px', color: 'var(--muted)' }}>
                {product.condition && (
                  <div>
                    <strong>Condition:</strong> {product.condition}
                  </div>
                )}
                <div>
                  <strong>Category:</strong> {product.category}
                </div>
                <div>
                  <strong>Status:</strong> {status}
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </article>
    </main>
    </>
  )
}
