'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthContext'

export default function BottomNav() {
  const pathname = usePathname() || '/'
  const { isAuthenticated } = useAuth()
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [clickedLink, setClickedLink] = useState(null)

  // Detect mobile device - more aggressive detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768 ||
                            'ontouchstart' in window ||
                            navigator.maxTouchPoints > 0
      setIsMobile(isMobileDevice)
      console.log('🎹 Mobile detection:', isMobileDevice, 'Width:', window.innerWidth)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect keyboard visibility - multiple methods
  useEffect(() => {
    if (!isMobile) return

    let initialViewportHeight = window.innerHeight
    let keyboardTimeout = null

    const hideNavigation = () => {
      console.log('🎹 Hiding navigation')
      setIsKeyboardVisible(true)
    }

    const showNavigation = () => {
      console.log('🎹 Showing navigation')
      setIsKeyboardVisible(false)
    }

    // Method 1: Visual Viewport API (most reliable)
    const handleVisualViewportChange = () => {
      const viewport = window.visualViewport
      const heightDiff = window.innerHeight - viewport.height
      console.log('🎹 Visual viewport change - Height diff:', heightDiff, 'Viewport height:', viewport.height)
      
      if (heightDiff > 150) {
        hideNavigation()
      } else {
        showNavigation()
      }
    }
    
    if ('visualViewport' in window) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange)
    }

    // Method 2: Focus events on inputs
    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        console.log('🎹 Input focused:', e.target.tagName)
        // Clear any existing timeout
        if (keyboardTimeout) clearTimeout(keyboardTimeout)
        
        // Check immediately and also after a delay
        const checkKeyboard = () => {
          const currentHeight = window.innerHeight
          const heightDiff = initialViewportHeight - currentHeight
          console.log('🎹 Keyboard check - Height diff:', heightDiff)
          
          if (heightDiff > 100) { // Lower threshold for more sensitivity
            hideNavigation()
          }
        }
        
        checkKeyboard()
        keyboardTimeout = setTimeout(checkKeyboard, 500)
      }
    }

    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        console.log('🎹 Input unfocused:', e.target.tagName)
        if (keyboardTimeout) clearTimeout(keyboardTimeout)
        
        // Delay showing navigation to allow keyboard to fully disappear
        setTimeout(showNavigation, 100)
      }
    }

    // Method 3: Window resize events
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDiff = initialViewportHeight - currentHeight
      
      if (heightDiff > 150) {
        hideNavigation()
      } else if (heightDiff < 50) {
        showNavigation()
      }
    }

    // Add all event listeners
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      if (keyboardTimeout) clearTimeout(keyboardTimeout)
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
      window.removeEventListener('resize', handleResize)
      if ('visualViewport' in window) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange)
      }
    }
  }, [isMobile])

  const links = [
    { href: '/#collection', label: 'Products', icon: '🛍️' },
    { href: '/sell', label: 'Sell', icon: '💰' },
    { href: '/about', label: 'About', icon: '🏢' },
  ]

  // Add Account link if authenticated, Login if not
  if (isAuthenticated) {
    links.push({ href: '/account', label: 'Account', icon: '👤' })
  } else {
    links.push({ href: '/login', label: 'Login', icon: '🔐' })
  }

  const isActive = (href) => {
    // Treat '/#collection' as active when on the homepage
    if (href.startsWith('/#')) return pathname === '/'
    return pathname === href
  }

  const handleLinkClick = (href) => {
    setClickedLink(href)
  }

  // Clear blinking when pathname changes (section opens)
  useEffect(() => {
    if (clickedLink) {
      // Check if we've navigated to the clicked section
      if ((clickedLink === '/#collection' && pathname === '/') || 
          (clickedLink !== '/#collection' && pathname === clickedLink)) {
        setClickedLink(null)
      }
    }
  }, [pathname, clickedLink])

  // Debug logging
  console.log('🎹 BottomNav render - isMobile:', isMobile, 'isKeyboardVisible:', isKeyboardVisible)

  // Hide bottom navigation on mobile when keyboard is visible
  if (isMobile && isKeyboardVisible) {
    console.log('🎹 BottomNav hidden due to keyboard')
    return null
  }

  return (
    <nav className="bottom-nav">
      {links.map((l) => (
        <div key={l.href} className="nav-item-container">
          <Link 
            href={l.href} 
            className={`bottom-nav-link ${isActive(l.href) ? 'active' : ''}`}
            onClick={() => handleLinkClick(l.href)}
          >
            <span className="nav-icon">{l.icon}</span>
            <span className="nav-label">{l.label}</span>
          </Link>
          
          {/* Hover circular container */}
          {clickedLink === l.href && (
            <div className="nav-hover-circle" />
          )}
        </div>
      ))}
      
      {/* CSS for hover circular containers */}
      <style jsx>{`
        .nav-item-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-hover-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.2);
          border: 2px solid #10b981;
          pointer-events: none;
          animation: blink 1s ease-in-out infinite;
          z-index: -1;
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 0.3;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
    </nav>
  )
}
