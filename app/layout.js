'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Nav from '../components/Nav'
import BottomNav from '../components/BottomNav'
import { CartProvider } from '../components/CartContext'
import { AuthProvider } from '../components/AuthContext'
import CurrentYear from '../components/CurrentYear'
import CartLockNotification from '../components/CartLockNotification'
import CartProtectionNotification from '../components/CartProtectionNotification'
import ClientFooter from '../components/ClientFooter'
import { useState, useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768 ||
                            'ontouchstart' in window ||
                            navigator.maxTouchPoints > 0
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect keyboard visibility
  useEffect(() => {
    if (!isMobile) return

    let initialViewportHeight = window.innerHeight
    let keyboardTimeout = null

    const hideFooter = () => {
      console.log('🎹 Hiding footer')
      setIsKeyboardVisible(true)
    }

    const showFooter = () => {
      console.log('🎹 Showing footer')
      setIsKeyboardVisible(false)
    }

    // Visual Viewport API
    const handleVisualViewportChange = () => {
      const viewport = window.visualViewport
      const heightDiff = window.innerHeight - viewport.height
      
      if (heightDiff > 150) {
        hideFooter()
      } else {
        showFooter()
      }
    }
    
    if ('visualViewport' in window) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
    }

    // Focus events
    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        if (keyboardTimeout) clearTimeout(keyboardTimeout)
        
        const checkKeyboard = () => {
          const currentHeight = window.innerHeight
          const heightDiff = initialViewportHeight - currentHeight
          
          if (heightDiff > 100) {
            hideFooter()
          }
        }
        
        checkKeyboard()
        keyboardTimeout = setTimeout(checkKeyboard, 300)
      }
    }

    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        if (keyboardTimeout) clearTimeout(keyboardTimeout)
        setTimeout(showFooter, 100)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      if (keyboardTimeout) clearTimeout(keyboardTimeout)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      if ('visualViewport' in window) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      }
    }
  }, [isMobile])

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <header className="site-header">
              <div className="container header-inner">
                <div className="brand">
                  <span className="logo" aria-hidden="true">♻️</span>
                  <h1 className="brand-title"><Link href="/">Super Twice EN<br/>Resellers</Link></h1>
                </div>
                <Nav />
              </div>
            </header>
            <main className="page-content">
              {children}
            </main>
            {/* Hide footer on mobile when keyboard is visible */}
            <footer 
              className="site-footer" 
              style={{
                display: isMobile && isKeyboardVisible ? 'none' : 'block',
                transform: isMobile && isKeyboardVisible ? 'translateY(100%)' : 'translateY(0)',
                transition: 'transform 0.3s ease-in-out'
              }}
            >
              <div className="container footer-inner">
                <div className="footer-content">
                  <ClientFooter />
                  <BottomNav />
                </div>
              </div>
            </footer>
            <CartLockNotification />
            <CartProtectionNotification />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

