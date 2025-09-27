'use client'

import Link from 'next/link'
import { useCart } from './CartContext'
import { useEffect, useState } from 'react'

export default function HeroCartButton() {
  const { totalCount } = useCart()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Link
      href="/cart"
      className="btn btn-small"
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 51,
        width: 52,
        height: 52,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      }}
      aria-label={`View cart with ${totalCount} items`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M6 6H4m2 0h14l-2 9H8L6 6Zm0 0L5 3H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="20" r="1.5" fill="currentColor"/>
        <circle cx="17" cy="20" r="1.5" fill="currentColor"/>
      </svg>
      {mounted && totalCount > 0 && (
        <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: 'blue', borderRadius: 999, padding: '0 6px', fontSize: 12, fontWeight: 800, lineHeight: '18px', height: 18, minWidth: 18, textAlign: 'center' }}>
          {totalCount}
        </span>
      )}
    </Link>
  )
}
