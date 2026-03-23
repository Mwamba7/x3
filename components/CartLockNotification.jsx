'use client'

import { useState, useEffect, useRef } from 'react'
import { useCart } from './CartContext'
import { useAuth } from './AuthContext'

export default function CartLockNotification() {
  const { isCartLocked, lockedCartItems } = useCart()
  const { user } = useAuth()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [hasShownLockNotification, setHasShownLockNotification] = useState(false)
  
  // Refs to track timeout IDs for proper cleanup
  const showTimeoutRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  
  // Cleanup function for timeouts
  const clearAllTimeouts = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }

  useEffect(() => {
    // Commented out to prevent duplicate notifications - product components handle this
    // const handleCartLockError = (event) => {
    //   const message = event.detail.hasDepositPaid 
    //     ? `🚫 Cannot add "${event.detail.productName}". You have paid a deposit for your current cart. Please complete that order first before adding new products.`
    //     : event.detail.message
    //   
    //   setNotificationMessage(message)
    //   setShowNotification(true)
    //   setTimeout(() => setShowNotification(false), 6000)
    // }

    const handleCartLocked = (event) => {
      console.log('🔒 Cart locked event received:', event.detail)
      
      // Only show notifications for authenticated users who are not admins
      if (!user || user.role === 'admin') {
        console.log('🔒 Skipping cart locked notification - user not authenticated or is admin:', user)
        return
      }
      
      // Enhanced event data handling
      const items = event.detail.items || {}
      const itemCount = event.detail.itemCount || Object.keys(items).length
      const totalQuantity = event.detail.totalQuantity || Object.values(items).reduce((sum, item) => sum + (item.qty || 1), 0)
      const timestamp = event.detail.timestamp
      
      console.log('🔒 Cart items:', items, 'Count:', itemCount, 'Total Quantity:', totalQuantity, 'User:', user.email)
      
      // Validate we have items before showing notification
      if (itemCount === 0 || totalQuantity === 0) {
        console.log('🔒 No items in cart lock event, skipping notification')
        return
      }
      
      // Mark that we've shown the lock notification
      setHasShownLockNotification(true)
      
      // Show notification after a short delay to allow order completion to show first
      clearAllTimeouts() // Clear any existing timeouts
      showTimeoutRef.current = setTimeout(() => {
        const message = `🔒 Cart locked! ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} secured with deposit payment.`
        console.log('🔒 Showing notification:', message, 'for user:', user.email)
        setNotificationMessage(message)
        setShowNotification(true)
        
        // Auto-hide after 5 seconds
        hideTimeoutRef.current = setTimeout(() => {
          setShowNotification(false)
          console.log('🔒 Notification hidden')
        }, 5000)
      }, 1000) // 1 second delay
    }

    const handleCartUnlocked = () => {
      clearAllTimeouts()
      setNotificationMessage('🔓 Cart unlocked! You can now add new products.')
      setShowNotification(true)
      setHasShownLockNotification(false)
      
      hideTimeoutRef.current = setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }

    // Removed cartLockError listener to prevent duplicate notifications
    window.addEventListener('cartLocked', handleCartLocked)
    window.addEventListener('cartUnlocked', handleCartUnlocked)

    return () => {
      clearAllTimeouts() // Clean up timeouts on unmount
      window.removeEventListener('cartLocked', handleCartLocked)
      window.removeEventListener('cartUnlocked', handleCartUnlocked)
    }
  }, [])

  // Fallback: Show notification if cart is locked but we haven't shown the notification yet
  useEffect(() => {
    // Only show notifications for authenticated users who are not admins
    if (!user || user.role === 'admin') {
      console.log('🔒 Skipping notification - user not authenticated or is admin:', user)
      return
    }
    
    if (isCartLocked && !hasShownLockNotification && Object.keys(lockedCartItems).length > 0) {
      console.log('🔒 Fallback: Cart is locked but no event received, showing notification for user:', user.email)
      const totalQuantity = Object.values(lockedCartItems).reduce((sum, item) => sum + (item.qty || 1), 0)
      const message = `🔒 Cart locked! ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''} secured with deposit payment.`
      setNotificationMessage(message)
      setShowNotification(true)
      setHasShownLockNotification(true)
      
      clearAllTimeouts() // Clear any existing timeouts
      hideTimeoutRef.current = setTimeout(() => {
        setShowNotification(false)
      }, 5000)
    }
  }, [isCartLocked, lockedCartItems, user, hasShownLockNotification]) // Added user to dependencies

  if (!showNotification) return null

  console.log('🔒 Showing notification:', notificationMessage, 'isCartLocked:', isCartLocked, 'User:', user?.email)

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: notificationMessage.includes('🚫') ? '#dc3545' : (isCartLocked ? '#28a745' : '#ffc107'),
      color: notificationMessage.includes('🚫') ? 'white' : (isCartLocked ? 'white' : '#212529'),
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
      zIndex: 99999,
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: '600',
      animation: 'slideInRight 0.3s ease-out',
      border: `3px solid ${notificationMessage.includes('🚫') ? '#c82333' : (isCartLocked ? '#1e7e34' : '#e0a800')}`,
      lineHeight: '1.4',
      display: 'block',
      visibility: 'visible'
    }}>
      {notificationMessage}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
