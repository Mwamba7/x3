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
  const [clickedIcon, setClickedIcon] = useState(null)

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

  const handleIconClick = (href) => {
    setClickedIcon(href)
    // Clear animation after 600ms
    setTimeout(() => setClickedIcon(null), 600)
  }

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
            onClick={() => handleIconClick(l.href)}
          >
            <span 
              className={`nav-icon ${clickedIcon === l.href ? 'icon-animate' : ''} ${l.label === 'Account' ? 'account-icon-blue' : ''}`}
            >{l.icon}</span>
            <span className="nav-label">{l.label}</span>
          </Link>
        </div>
      ))}
      
      <style jsx>{`
        .nav-item-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-icon {
          display: inline-block;
          transition: transform 0.2s ease;
        }
        
        .nav-icon.account-icon-blue {
          filter: brightness(0) saturate(100%) invert(35%) sepia(91%) saturate(1590%) hue-rotate(202deg) brightness(101%) contrast(101%);
        }
        
        .nav-icon.icon-animate {
          animation: iconBounce 0.6s ease-in-out;
        }
        
        @keyframes iconBounce {
          0% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.3) rotate(-5deg);
          }
          50% {
            transform: scale(1.5) rotate(5deg);
          }
          75% {
            transform: scale(1.3) rotate(-2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </nav>
  )
}
