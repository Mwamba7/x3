'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'

export default function HeroRotator({ products = [], intervalMs = 7000 }) {
  const list = useMemo(() => {
    if (!Array.isArray(products)) return []
    
    // Show all available products (new, refurbished, preowned, brand new)
    return products.filter(p => 
      p?.id && 
      p?.img && 
      p?.status !== 'sold'
    )
  }, [products])
  const [idx, setIdx] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [shuffleTrigger, setShuffleTrigger] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isSlideIn, setIsSlideIn] = useState(false)
  const [showSoldOverlay, setShowSoldOverlay] = useState(null)
  const { addItem, removeItem, items } = useCart()

  // Memoize current and next shuffled products for smooth transitions
  const currentProducts = useMemo(() => {
    return [...list].sort(() => Math.random() - 0.5)
  }, [list, shuffleTrigger])
  
  const nextProducts = useMemo(() => {
    return [...list].sort(() => Math.random() - 0.5)
  }, [list, shuffleTrigger, isTransitioning])

  useEffect(() => {
    setMounted(true)
    
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  useEffect(() => {
    if (!list.length || !mounted) return
    
    const t = setInterval(() => {
      setIdx(i => (i + 1) % list.length)
    }, Math.max(1500, intervalMs || 5000))
    return () => clearInterval(t)
  }, [list.length, intervalMs, mounted])

  if (!list.length) return null
  
  if (!mounted) {
    return <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a101a 0%, #0e1421 100%)' }} />
  }
  
  // Use small screen layout for all screen sizes

  // Small screen sliding behavior
  const currentProduct = list[idx]
  if (!currentProduct) return null

  return (
    <>
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          transition: 'opacity 500ms ease',
          background: isLargeScreen ? 'linear-gradient(135deg, #0a101a 0%, #0e1421 100%)' : 'transparent'
        }}>
          {!isLargeScreen && (
            <img
              key={idx}
              src={currentProduct.img}
              alt={currentProduct.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                filter: 'brightness(0.7) contrast(1.08)', 
                animation: 'heroSlideIn 700ms ease both' 
              }}
            />
          )}
        </div>
      </div>
      
      {/* Product overlays - only show on small screens */}
      {!isLargeScreen && (
        <>
          {/* Product name overlay - top left */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '2px',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {/* Product name */}
            <div style={{
              padding: '8px 12px',
              width: '140px',
              height: '18px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <p style={{
                margin: 0,
                fontSize: '16px',
                color: 'white',
                fontWeight: '500',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%'
              }}>
                {currentProduct.name}
              </p>
            </div>
          </div>


          {/* Status indicator and price - bottom left */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            {/* Status text */}
            <span style={{
              fontSize: '14px',
              color: currentProduct.status === 'sold' ? '#ef4444' : '#22c55e',
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {currentProduct.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
            </span>
            
            {/* Price */}
            <span style={{
              fontSize: '14px',
              color: 'white',
              fontWeight: '600',
              textShadow: '0 2px 4px rgba(0,0,0,0.9)'
            }}>
              Ksh {Number(currentProduct.price || 0).toLocaleString('en-KE')}
            </span>
          </div>

          {/* Buy Now button - bottom right */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 2
          }}>
            <Link 
              href={`/product/${currentProduct.id}`}
              className="btn btn-primary hero-buy-now-btn"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: currentProduct.status === 'sold' ? '#9ca3af' : 'var(--primary)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: 'none',
                opacity: currentProduct.status === 'sold' ? 0.6 : 1,
                pointerEvents: currentProduct.status === 'sold' ? 'none' : 'auto',
                cursor: currentProduct.status === 'sold' ? 'not-allowed' : 'pointer'
              }}
            >
              {currentProduct.status === 'sold' ? 'Sold Out' : 'Buy Now'}
            </Link>
          </div>
        </>
      )}

      {/* Hero content overlay - responsive for all screen sizes */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(0deg, rgba(14,17,22,0.8), rgba(14,17,22,0.3))',
        display: isLargeScreen ? 'flex' : 'none',
        alignItems: 'center',
        zIndex: 1
      }}>
        <div className="container" style={{ textAlign: 'left', color: 'white' }}>
          <div className="hero-content-section">
            <h2 style={{ 
              fontSize: isLargeScreen ? 'clamp(24px, 4vw, 36px)' : 'clamp(14px, 3.4vw, 20px)', 
              marginBottom: isLargeScreen ? 12 : 6, 
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              lineHeight: '1.2'
            }}>
              Quality Pre‑Owned + New Electronics & Appliances
            </h2>
            <h2 style={{ 
              fontSize: isLargeScreen ? 'clamp(20px, 3.5vw, 28px)' : 'clamp(13px, 3.2vw, 18px)', 
              marginBottom: isLargeScreen ? 20 : 16, 
              color: 'var(--primary)', 
              fontWeight: '600',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              lineHeight: '1.2'
            }}>
              Outfits, Fashion & Sneakers.
            </h2>
            <p style={{ 
              fontSize: isLargeScreen ? 'clamp(16px, 2.5vw, 20px)' : 'clamp(12px, 2.5vw, 16px)', 
              color: '#e0e0e0', 
              marginBottom: isLargeScreen ? 28 : 20, 
              maxWidth: isLargeScreen ? '70%' : '90%',
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              lineHeight: '1.4'
            }}>
              Save money. Reduce waste. Buy dependable, refurbished items with warranty.
            </p>
            <div style={{ display: 'flex', gap: isLargeScreen ? 16 : 12, flexWrap: 'wrap' }}>
              <Link href="/#collection" className="btn btn-primary hero-btn-primary" style={{ 
                padding: isLargeScreen ? '12px 18px' : '8px 12px', 
                fontSize: isLargeScreen ? '14px' : '12px',
                fontWeight: '600'
              }}>
                Browse Products
              </Link>
              <Link href="/sell" className="btn hero-btn-secondary" style={{ 
                padding: isLargeScreen ? '12px 18px' : '8px 12px', 
                fontSize: isLargeScreen ? '14px' : '12px',
                backgroundColor: '#2d3748',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white'
              }}>
                Want to Sell Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heroSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes soldOverlayFadeIn { 
          from { opacity: 0; transform: scale(0.9); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes lockBounce { 
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          filter: brightness(1.1);
          transition: all 0.2s ease;
        }
        .hero-btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          background-color: #4a5568 !important;
          transition: all 0.2s ease;
        }
        .hero-btn-primary, .hero-btn-secondary, .hero-buy-now-btn {
          transition: all 0.2s ease;
        }
        .hero-buy-now-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          filter: brightness(1.1);
        }
        .hero-view-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          filter: brightness(1.1);
        }
        .hero-cart-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          filter: brightness(1.1);
        }
        .hero-grid-item {
          overflow: hidden;
        }
        .hero-grid-item:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        .hero-grid-item.sold:hover {
          transform: scale(0.98);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        /* Custom scrollbar for horizontal scroll */
        .hero-horizontal-scroll {
          scrollbar-width: auto; /* Firefox */
          scrollbar-color: rgba(255,255,255,0.6) rgba(0,0,0,0.2); /* Firefox */
        }
        .hero-horizontal-scroll::-webkit-scrollbar {
          height: 12px;
          -webkit-appearance: none;
        }
        .hero-horizontal-scroll::-webkit-scrollbar:horizontal {
          height: 12px;
        }
        .hero-horizontal-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 6px;
          margin: 0 10px;
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.1);
        }
        .hero-horizontal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.6);
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.1);
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.1);
        }
        .hero-horizontal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.8);
        }
        .hero-horizontal-scroll::-webkit-scrollbar-thumb:active {
          background: rgba(255,255,255,0.9);
        }
        .hero-horizontal-scroll::-webkit-scrollbar-corner {
          background: rgba(0,0,0,0.2);
        }
      `}</style>
    </>
  )
}
