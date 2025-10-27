'use client'

import { useState, useEffect } from 'react'
import { useCart } from './CartContext'

export default function CartLockNotification() {
  const { isCartLocked, lockedCartItems } = useCart()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

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
      const itemCount = Object.keys(event.detail.items || {}).length
      setNotificationMessage(`🔒 Cart locked! ${itemCount} items secured with deposit payment.`)
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 5000)
    }

    const handleCartUnlocked = () => {
      setNotificationMessage('🔓 Cart unlocked! You can now add new products.')
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }

    // Removed cartLockError listener to prevent duplicate notifications
    window.addEventListener('cartLocked', handleCartLocked)
    window.addEventListener('cartUnlocked', handleCartUnlocked)

    return () => {
      window.removeEventListener('cartLocked', handleCartLocked)
      window.removeEventListener('cartUnlocked', handleCartUnlocked)
    }
  }, [])

  if (!showNotification) return null

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
      zIndex: 10000,
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: '600',
      animation: 'slideInRight 0.3s ease-out',
      border: `3px solid ${notificationMessage.includes('🚫') ? '#c82333' : (isCartLocked ? '#1e7e34' : '#e0a800')}`,
      lineHeight: '1.4'
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
