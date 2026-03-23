'use client'

import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="brand-title" style={{ 
        borderBottom: '2px solid #39d98a',
        paddingBottom: '2px',
        display: 'inline-block'
      }}>
        <div style={{ fontSize: 'clamp(12px, 2.5vw, 16px)', color: 'white' }}>Uthiru, EN Market</div>
        <div style={{ 
          fontSize: 'clamp(10px, 2vw, 13px)', 
          opacity: 0.8,
          color: '#39d98a'
        }}>Waiyaki way</div>
      </Link>
    </nav>
  )
}
