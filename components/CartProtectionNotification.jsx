'use client'

import { useEffect, useState } from 'react'

/**
 * Cart Protection Notification Component
 * Shows notifications when cart clearing is blocked
 */
export default function CartProtectionNotification() {
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const handleCartClearBlocked = (event) => {
      const { reason, message } = event.detail
      
      setNotification({
        type: 'warning',
        message: message,
        reason: reason,
        timestamp: Date.now()
      })
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleCartLockError = (event) => {
      const { message, productName } = event.detail
      
      console.log('🚫 CartProtectionNotification received cartLockError:', {
        message,
        productName,
        timestamp: new Date().toISOString()
      })
      
      setNotification({
        type: 'error',
        message: 'You need to first complete the products paid for. Your cart is locked because you have made a deposit payment. Please complete your current order before adding new items.',
        productName: productName,
        timestamp: Date.now()
      })
      
      // Auto-hide after 8 seconds for product addition errors
      setTimeout(() => {
        setNotification(null)
      }, 8000)
    }

    window.addEventListener('cartClearBlocked', handleCartClearBlocked)
    window.addEventListener('cartLockError', handleCartLockError)
    
    return () => {
      window.removeEventListener('cartClearBlocked', handleCartClearBlocked)
      window.removeEventListener('cartLockError', handleCartLockError)
    }
  }, [])

  if (!notification) return null

  const getIcon = () => {
    switch (notification.type) {
      case 'warning': return '⚠️'
      case 'error': return '🚫'
      default: return 'ℹ️'
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'warning': return 'rgba(255, 255, 255, 0.95)'
      case 'error': return 'rgba(255, 255, 255, 0.95)'
      default: return 'rgba(255, 255, 255, 0.95)'
    }
  }

  const getTextColor = () => {
    switch (notification.type) {
      case 'warning': return '#ff8c00'
      case 'error': return '#dc3545'
      default: return '#0dcaf0'
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '120px',
        right: '20px',
        zIndex: 10000,
        background: notification.type === 'error' ? 'rgba(255, 245, 245, 0.98)' : getBackgroundColor(),
        color: getTextColor(),
        padding: '18px 22px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        border: notification.type === 'error' ? '2px solid #dc3545' : '1px solid rgba(0,0,0,0.1)',
        maxWidth: '420px',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        animation: 'slideInRight 0.4s ease-out'
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0 }}>
        {getIcon()}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '15px' }}>
          {notification.type === 'error' ? 'Complete Paid Order First' : 'Cart Protected'}
        </div>
        <div style={{ opacity: 0.9, lineHeight: 1.5, fontSize: '13px' }}>
          {notification.message}
        </div>
        {notification.type === 'error' && (
          <div style={{ 
            marginTop: '8px', 
            padding: '6px 10px', 
            backgroundColor: 'rgba(220, 53, 69, 0.1)', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: '600',
            color: '#dc3545'
          }}>
            💡 Tip: Complete your checkout to unlock the cart
          </div>
        )}
      </div>
      <button
        onClick={() => setNotification(null)}
        style={{
          background: 'none',
          border: 'none',
          color: getTextColor(),
          fontSize: '16px',
          cursor: 'pointer',
          padding: '0',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          opacity: 0.8
        }}
        onMouseOver={(e) => e.target.style.opacity = '1'}
        onMouseOut={(e) => e.target.style.opacity = '0.8'}
      >
        ×
      </button>
      
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
