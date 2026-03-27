'use client'

import Link from 'next/link'
import { useCart } from './CartContext'
import { useEffect, useState } from 'react'
import CartStatusIndicator from './CartStatusIndicator'
import { useRouter } from 'next/navigation'

export default function HeroCartButton() {
  const { totalCount, isCartLocked } = useCart()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCartClick = (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate loading delay then navigate
    setTimeout(() => {
      router.push('/cart')
    }, 800) // 800ms delay to show spinner
  }

  return (
    <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 51 }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <Link
          href="/cart"
          className="btn btn-small cart-button"
          onClick={handleCartClick}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            border: '2px solid #ef4444',
            position: 'relative',
            cursor: isLoading ? 'default' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            textDecoration: 'none',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label={`View cart with ${totalCount} items`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ fill: 'white', stroke: 'white' }}>
            <path d="M6 6H4m2 0h14l-2 9H8L6 6Zm0 0L5 3H3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="10" cy="20" r="1.5" fill="white"/>
            <circle cx="17" cy="20" r="1.5" fill="white"/>
          </svg>
          {mounted && totalCount > 0 && (
            <span style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              background: 'var(--primary)', 
              color: '#0a101a', 
              borderRadius: 999, 
              padding: '0 6px', 
              fontSize: 12, 
              fontWeight: 800, 
              lineHeight: '18px', 
              height: 18, 
              minWidth: 18, 
              textAlign: 'center',
              border: undefined,
              opacity: isLoading ? 0.3 : 1,
            }}>
              {isCartLocked ? '🔒' : totalCount}
            </span>
          )}
        </Link>
        
        {/* Loading Spinner Outside the Red Border */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: 68,
            height: 68,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10,
          }}>
            <div style={{
              width: 24,
              height: 24,
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
          </div>
        )}
      </div>
      
      {/* CSS for spinner animation and hover effect removal */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .cart-button {
          -webkit-tap-highlight-color: transparent !important;
        }
        
        .cart-button:hover,
        .cart-button:focus,
        .cart-button:active {
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>
    </div>
  )
}
