'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useCart } from './CartContext'

export default function HeroRotator({ products = [], intervalMs = 7000 }) {
  const list = useMemo(() => (Array.isArray(products) ? products.filter(p => p?.id && p?.img) : []), [products])
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
    if (!list.length || !mounted || isLargeScreen) return
    
    const t = setInterval(() => {
      setIdx(i => (i + 1) % list.length)
    }, Math.max(1500, intervalMs || 5000))
    return () => clearInterval(t)
  }, [list.length, intervalMs, mounted, isLargeScreen])

  // Auto-rotation for first container on large screens (like small screen behavior)
  useEffect(() => {
    if (!list.length || !mounted || !isLargeScreen) return
    
    const rotateInterval = setInterval(() => {
      setIdx(i => (i + 1) % list.length)
    }, Math.max(1500, intervalMs || 5000))
    
    return () => clearInterval(rotateInterval)
  }, [list.length, intervalMs, mounted, isLargeScreen])

  if (!list.length) return null
  
  if (!mounted) {
    return <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a101a 0%, #0e1421 100%)' }} />
  }
  
  // On large screens, show multiple products in a grid
  if (isLargeScreen) {
    const isXLarge = window.innerWidth >= 1024
    const columns = isXLarge ? 3 : 2
    const rows = 2
    const maxProducts = (columns * rows) - 1 // Remove one container
    // First container gets rotating image, others get fixed images
    const rotatingProduct = list[idx] // Rotating product for first container
    const staticProducts = currentProducts.slice(0, maxProducts - 1) // Fixed products for other containers
    const displayProducts = [rotatingProduct, ...staticProducts].filter(Boolean)
    
    return (
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0
      }}>
        <div style={{
          width: 'min(1480px, 92%)',
          maxWidth: '1480px',
          display: 'grid', 
          gridTemplateColumns: isXLarge ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', 
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '12px',
          padding: '12px',
          height: 'calc(100% - 24px)',
          margin: '12px 0'
        }}>
        {displayProducts.map((product, index) => {
          if (!product) return null;
          return (
          <div 
            key={index === 0 ? `rotating-${idx}` : `${product.id}-${shuffleTrigger}`} 
            className={`hero-grid-item ${product.status === 'sold' ? 'sold' : ''}`}
            onClick={() => {
              if (product.status === 'sold') {
                setShowSoldOverlay(product.id);
                setTimeout(() => setShowSoldOverlay(null), 1500);
              }
            }}
            style={{ 
              position: 'relative', 
              overflow: 'hidden',
              borderRadius: '12px',
              background: '#0e1421',
              minHeight: '150px',
              width: '100%',
              height: '100%',
              cursor: product.status === 'sold' ? 'not-allowed' : 'default',
              transition: 'all 0.3s ease'
            }}>
            {/* Product condition and price overlay - top */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              zIndex: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{
                  fontSize: '18px',
                  color: 'white',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.9)'
                }}>
                  {product.condition || 'Good'}
                </span>
                <span style={{
                  fontSize: '12px',
                  color: product.status === 'sold' ? '#ef4444' : '#22c55e',
                  fontWeight: '600',
                  textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  alignSelf: 'flex-start'
                }}>
                  {product.status === 'sold' ? 'Sold' : 'Available'}
                </span>
              </div>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '4px 8px',
                borderRadius: '4px',
                backdropFilter: 'blur(4px)'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: 'white',
                  fontWeight: '700',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                }}>
                  Ksh {Number(product.price || 0).toLocaleString('en-KE')}
                </span>
              </div>
            </div>

            <img
              key={index === 0 ? idx : product.id}
              src={product.img}
              alt={product.name}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                filter: 'brightness(0.8) contrast(1.1)',
                transition: 'all 0.3s ease',
                animation: index === 0 ? 'heroSlideIn 700ms ease both' : 'none'
              }}
            />
            
            {/* Sold overlay with lock emoji */}
            {showSoldOverlay === product.id && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                animation: 'soldOverlayFadeIn 0.3s ease-out'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '8px',
                  animation: 'lockBounce 0.6s ease-out'
                }}>
                  🔒
                </div>
                <span style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  SOLD
                </span>
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
              padding: '16px 12px 12px',
              color: 'white'
            }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                lineHeight: '1.2',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {product.name}
              </h4>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Link
                  href={`/product/${product.id}`}
                  className="btn btn-primary hero-view-btn"
                  style={{
                    fontSize: '11px',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    display: 'inline-block',
                    flex: '1',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: product.status === 'sold' ? 0.6 : 1,
                    pointerEvents: product.status === 'sold' ? 'none' : 'auto'
                  }}
                >
                  View More
                </Link>
                <button
                  className="btn hero-cart-btn"
                  disabled={product.status === 'sold'}
                  onClick={(e) => {
                    e.preventDefault();
                    if (product.status === 'sold') return;
                    if (items[product.id]) {
                      removeItem(product.id);
                    } else {
                      addItem(product);
                    }
                  }}
                  style={{
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    backgroundColor: product.status === 'sold' ? '#9ca3af' : (items[product.id] ? '#ef4444' : '#6b7280'),
                    color: 'white',
                    border: 'none',
                    cursor: product.status === 'sold' ? 'not-allowed' : 'pointer',
                    flex: '1',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    opacity: product.status === 'sold' ? 0.6 : 1
                  }}
                >
                  {product.status === 'sold' ? 'Sold' : (items[product.id] ? 'Remove' : 'Add to Cart')}
                </button>
              </div>
            </div>
          </div>
          )
        })}
        </div>
      </div>
    )
  }

  // Small screen sliding behavior
  const currentProduct = list[idx]
  if (!currentProduct) return null

  return (
    <>
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'opacity 500ms ease' }}>
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
        </div>
      </div>
      
      {/* Product name overlay - top left */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '8px 12px',
        borderRadius: '6px',
        backdropFilter: 'blur(4px)',
        width: '140px',
        height: '18px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: '#22c55e',
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
            backgroundColor: 'var(--primary)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            border: 'none'
          }}
        >
          Buy Now
        </Link>
      </div>

      {/* Hero content overlay - only on mobile */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(0deg, rgba(14,17,22,0.8), rgba(14,17,22,0.3))',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1
      }}>
        <div className="container" style={{ textAlign: 'left', color: 'white' }}>
          <h2 style={{ 
            fontSize: 'clamp(14px, 3.4vw, 20px)', 
            marginBottom: 6, 
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            lineHeight: '1.2'
          }}>
            Quality Pre‑Owned + New Electronics & Appliances
          </h2>
          <h2 style={{ 
            fontSize: 'clamp(13px, 3.2vw, 18px)', 
            marginBottom: 16, 
            color: 'var(--primary)', 
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            lineHeight: '1.2'
          }}>
            Outfits, Fashion & Sneakers.
          </h2>
          <p style={{ 
            fontSize: 'clamp(12px, 2.5vw, 16px)', 
            color: '#e0e0e0', 
            marginBottom: 20, 
            maxWidth: '90%',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            lineHeight: '1.4'
          }}>
            Save money. Reduce waste. Buy dependable, refurbished items with warranty.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/#collection" className="btn btn-primary hero-btn-primary" style={{ 
              padding: '8px 12px', 
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Browse Products
            </Link>
            <Link href="/sell" className="btn hero-btn-secondary" style={{ 
              padding: '8px 12px', 
              fontSize: '12px',
              backgroundColor: '#2d3748',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white'
            }}>
              Want to Sell Product
            </Link>
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
      `}</style>
    </>
  )
}
