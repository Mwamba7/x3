'use client'

import { useEffect, useState } from 'react'
import { useCart } from './CartContext'

/**
 * Automatic payment status checker component
 * Polls for payment status and updates localStorage when payment is detected
 */
export default function PaymentStatusChecker() {
  const { isCartLocked, lockCart, unlockCart } = useCart()
  const [isChecking, setIsChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    // Only run if cart is not locked (payment not detected yet)
    if (isCartLocked) return

    const checkPaymentStatus = async () => {
      if (isChecking) return // Prevent multiple simultaneous checks
      
      setIsChecking(true)
      
      try {
        // Get any stored checkout request ID from recent payment attempts
        const recentPayments = JSON.parse(localStorage.getItem('recentPaymentAttempts') || '[]')
        
        // Check each recent payment attempt
        for (const attempt of recentPayments) {
          if (attempt.checkoutRequestId) {
            const response = await fetch(`/api/paystack/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: attempt.checkoutRequestId })
      })
            const result = await response.json()
            
            if (result.success && result.found && result.payment.depositPaid) {
              console.log('✅ Payment detected!', result)
              
              // Update localStorage with payment record
              localStorage.setItem('paystackPayment', JSON.stringify(result.paymentRecord))
              
              // Lock the cart
              lockCart(true)
              
              // Remove this attempt from recent payments
              const updatedAttempts = recentPayments.filter(a => a.checkoutRequestId !== attempt.checkoutRequestId)
              localStorage.setItem('recentPaymentAttempts', JSON.stringify(updatedAttempts))
              
              console.log('🔒 Cart locked due to successful payment')
              break
            }
          }
        }
        
        // Also check by cart ID if we have one
        const cartData = JSON.parse(localStorage.getItem('cart:v1') || '{}')
        const cartId = Object.keys(cartData).length > 0 ? 'cart-' + Date.now() : null
        
        if (cartId && recentPayments.length === 0) {
          const response = await fetch(`/api/paystack/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: cartId })
          })
          const result = await response.json()
          
          if (result.success && result.found && result.payment.depositPaid) {
            console.log('✅ Payment detected by cart ID!', result)
            localStorage.setItem('paystackPayment', JSON.stringify(result.paymentRecord))
            lockCart(true)
          }
        }
        
      } catch (error) {
        console.error('❌ Error checking payment status:', error)
      } finally {
        setIsChecking(false)
        setLastCheck(new Date())
      }
    }

    // Check immediately on mount
    checkPaymentStatus()
    
    // Then check every 10 seconds
    const interval = setInterval(checkPaymentStatus, 10000)
    
    return () => clearInterval(interval)
  }, [isCartLocked, isChecking, lockCart])

  // Helper function to store payment attempts
  useEffect(() => {
    const handlePaymentAttempt = (event) => {
      if (event.detail && event.detail.checkoutRequestId) {
        const recentPayments = JSON.parse(localStorage.getItem('recentPaymentAttempts') || '[]')
        const newAttempt = {
          checkoutRequestId: event.detail.checkoutRequestId,
          timestamp: new Date().toISOString(),
          cartId: event.detail.cartId
        }
        
        // Keep only last 5 attempts
        const updatedAttempts = [newAttempt, ...recentPayments].slice(0, 5)
        localStorage.setItem('recentPaymentAttempts', JSON.stringify(updatedAttempts))
        
        console.log('💾 Stored payment attempt for tracking:', newAttempt)
      }
    }

    window.addEventListener('paymentAttempt', handlePaymentAttempt)
    return () => window.removeEventListener('paymentAttempt', handlePaymentAttempt)
  }, [])

  // Don't render anything visible - this is a background service
  return null
}

// Helper function to trigger payment attempt tracking
export function trackPaymentAttempt(checkoutRequestId, cartId) {
  const event = new CustomEvent('paymentAttempt', {
    detail: { checkoutRequestId, cartId }
  })
  window.dispatchEvent(event)
}
