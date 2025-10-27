"use client"

import { useState, useEffect } from 'react'
import { useCart } from './CartContext'

export default function SimplePayment({ totalAmount, subtotalAmount, deliveryFee, totalCount, onPaymentComplete, disabled = false, paymentCompleted = false, savedPaymentPhone = '' }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [paid, setPaid] = useState(false)
  const [checkoutRequestId, setCheckoutRequestId] = useState(null)
  const [polling, setPolling] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('idle') // idle, processing, pending, completed, failed
  const { lockCart } = useCart()

  const depositAmount = Math.round(totalAmount * 0.2) // 20% deposit

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (polling) {
        setPolling(false)
      }
    }
  }, [])

  // Retry payment function
  const retryPayment = () => {
    setLoading(false)
    setPolling(false)
    setCheckoutRequestId(null)
    setMessage('')
    setPaymentStatus('idle')
    console.log('🔄 Payment retry - clearing previous state')
  }

  // Poll payment status
  const pollPaymentStatus = async (requestId) => {
    let attempts = 0
    const maxAttempts = 120 // 10 minutes (120 attempts * 5 seconds) - extended timeout
    
    setPolling(true)
    setPaymentStatus('pending')
    
    const poll = async () => {
      try {
        attempts++
        
        console.log(`🔍 Polling attempt ${attempts}/${maxAttempts} for CheckoutRequestID:`, requestId)
        
        const response = await fetch('/api/mpesa/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId: requestId })
        })

        const data = await response.json()
        console.log('📊 Payment status response:', data)

        if (data.success && data.status === 'completed') {
          // Payment successful - ONLY if we have actual transaction details
          console.log('✅ Payment completed successfully!')
          console.log('💰 Transaction details:', data)
          
          // Verify we have actual transaction ID (not just a mock response)
          if (data.transactionId && data.transactionId !== 'undefined') {
            setMessage('✅ Payment successful! Deposit confirmed.')
            setPaid(true)
            setPolling(false)
            setPaymentStatus('completed')
            
            // Lock the cart to prevent further modifications
            lockCart(true)
            
            if (onPaymentComplete) {
              onPaymentComplete(true, phone)
            }
            return
          } else {
            console.log('⚠️ Payment marked as completed but no transaction ID - continuing to poll')
            // Continue polling if no real transaction ID
          }
        } else if (data.status === 'cancelled') {
          // Payment cancelled
          console.log('❌ Payment cancelled by user')
          setMessage('❌ Payment was cancelled. Please try again.')
          setPaymentStatus('failed')
          setPolling(false)
          setLoading(false)
          return
        } else if (data.status === 'timeout') {
          // Payment timeout
          console.log('⏰ Payment timed out')
          setMessage('⏰ Payment timed out. Please try again.')
          setPaymentStatus('failed')
          setPolling(false)
          setLoading(false)
          return
        } else if (data.status === 'failed') {
          // Payment failed
          console.log('❌ Payment failed')
          setMessage(`❌ ${data.message || 'Payment failed. Please try again.'}`)
          setPaymentStatus('failed')
          setPolling(false)
          setLoading(false)
          return
        } else if (data.status === 'pending') {
          // Continue polling indefinitely
          setMessage(`⏳ Waiting for payment confirmation... Please complete the M-Pesa payment on your phone.`)
          setTimeout(poll, 5000) // Poll every 5 seconds
        } else {
          // Unknown status - continue polling
          console.log('❓ Unknown payment status, continuing to poll...')
          setMessage(`⏳ Checking payment status... Please complete the M-Pesa payment on your phone.`)
          setTimeout(poll, 5000)
        }
      } catch (error) {
        console.error('💥 Payment status check error:', error)
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setMessage('❌ Payment verification failed. Please contact support.')
          setPaymentStatus('failed')
          setPolling(false)
          setLoading(false)
        }
      }
    }

    // Start polling after 3 seconds
    setTimeout(poll, 3000)
  }

  const handlePayment = async () => {
    if (disabled) {
      setMessage('Please complete delivery details first')
      return
    }
    
    if (!phone) {
      setMessage('Please enter your phone number')
      return
    }

    // Validate phone number format
    const phoneRegex = /^(0[17]\d{8}|254[17]\d{8}|\+254[17]\d{8})$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setMessage('Please enter a valid Kenyan phone number (e.g., 0712345678)')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')
    setMessage('📱 Sending M-Pesa request to your phone...')

    try {
      console.log('💳 Initiating STK Push for amount:', depositAmount)
      
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\s/g, ''),
          amount: depositAmount,
          reference: `DEP${Date.now()}`
        })
      })

      const data = await response.json()
      console.log('📊 STK Push response:', data)

      if (data.success && data.checkoutRequestId) {
        setCheckoutRequestId(data.checkoutRequestId)
        setMessage('📱 M-Pesa prompt sent! Please check your phone and enter your M-Pesa PIN.')
        
        // Start polling for payment status
        pollPaymentStatus(data.checkoutRequestId)
      } else {
        console.error('❌ STK Push failed:', data)
        setMessage(`❌ ${data.error || 'Failed to send payment request. Please try again.'}`)
        setPaymentStatus('failed')
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 Payment request error:', error)
      setMessage('❌ Network error. Please check your connection and try again.')
      setPaymentStatus('failed')
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>💳 M-Pesa Payment (20% Deposit)</h3>
        
        {/* Payment Breakdown */}
        <div style={{
          backgroundColor: 'rgba(42, 51, 66, 0.1)',
          padding: '8px',
          borderRadius: 4,
          marginBottom: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
            <span>Total Amount:</span>
            <span><strong>Ksh {totalAmount.toLocaleString()}</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--primary)' }}>
            <span>Deposit (20%):</span>
            <span><strong>Ksh {depositAmount.toLocaleString()}</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
            <span>Balance (on delivery):</span>
            <span>Ksh {(totalAmount - depositAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Phone Number - Locked */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={savedPaymentPhone || phone}
            readOnly
            disabled
            style={{
              width: '100%',
              padding: '10px 8px',
              borderRadius: 4,
              border: '1px solid #3a465c',
              background: '#374151',
              color: '#9ca3af',
              fontSize: '12px',
              boxSizing: 'border-box',
              opacity: 0.7,
              cursor: 'not-allowed'
            }}
          />
        </div>

        {/* Success Message */}
        <div style={{
          padding: '8px',
          backgroundColor: '#d1fae5',
          border: '1px solid #10b981',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#065f46'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
            ✅ Payment Successful!
          </div>
          <div style={{ fontSize: 11 }}>
            Deposit of Ksh {depositAmount.toLocaleString()} confirmed.
            <br />
            You can now proceed with your order.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>💳 M-Pesa Payment (20% Deposit)</h3>
      
      {/* Payment Breakdown */}
      <div style={{
        backgroundColor: 'rgba(42, 51, 66, 0.1)',
        padding: '8px',
        borderRadius: 4,
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span>Total Amount:</span>
          <span><strong>Ksh {totalAmount.toLocaleString()}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--primary)' }}>
          <span>Deposit (20%):</span>
          <span><strong>Ksh {depositAmount.toLocaleString()}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
          <span>Balance (on delivery):</span>
          <span>Ksh {(totalAmount - depositAmount).toLocaleString()}</span>
        </div>
      </div>

      {/* Horizontal Layout: Phone Number Left, Pay Now Button Right */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        
        {/* Left Side - Phone Number */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              disabled={disabled || paymentCompleted}
              style={{
                width: '100%',
                padding: '10px 8px',
                borderRadius: 4,
                border: '1px solid #3a465c',
                background: (disabled || paymentCompleted) ? '#374151' : 'var(--bg)',
                color: (disabled || paymentCompleted) ? '#9ca3af' : 'var(--text)',
                fontSize: '12px',
                boxSizing: 'border-box',
                opacity: (disabled || paymentCompleted) ? 0.7 : 1,
                cursor: (disabled || paymentCompleted) ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {message && (
            <div style={{
              padding: '6px',
              borderRadius: 4,
              marginBottom: 8,
              backgroundColor: message.includes('sent') || message.includes('successful') ? '#d4edda' : '#f8d7da',
              border: `1px solid ${message.includes('sent') || message.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`,
              color: message.includes('sent') || message.includes('successful') ? '#155724' : '#721c24',
              fontSize: 11
            }}>
              {message}
            </div>
          )}

          <div style={{ 
            fontSize: 10, 
            color: 'var(--muted)', 
            lineHeight: 1.3
          }}>
            You will receive an M-Pesa prompt on your phone
          </div>
        </div>

        {/* Right Side - Pay Now Button */}
        <div style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: '18px' }}>
          {paymentStatus === 'idle' || paymentStatus === 'failed' ? (
            <button
              onClick={handlePayment}
              disabled={loading || !phone || disabled}
              className="btn"
              style={{
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                opacity: loading || !phone || disabled ? 0.5 : 1,
                cursor: loading || !phone || disabled ? 'not-allowed' : 'pointer',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxSizing: 'border-box',
                backgroundColor: paymentStatus === 'failed' ? '#dc2626' : undefined,
                borderColor: paymentStatus === 'failed' ? '#dc2626' : undefined
              }}
            >
              {paymentStatus === 'processing' ? (
                <>
                  <span style={{ fontSize: '10px' }}>📱</span>
                  <span>Sending...</span>
                </>
              ) : paymentStatus === 'failed' ? (
                <>
                  <span style={{ fontSize: '10px' }}>🔄</span>
                  <span>Retry Payment</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '10px' }}>💳</span>
                  <span>Pay Now</span>
                </>
              )}
            </button>
          ) : paymentStatus === 'pending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <div style={{
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 600,
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: 4,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                border: '1px solid #fbbf24'
              }}>
                📱 Waiting for Payment
              </div>
              <button
                onClick={retryPayment}
                className="btn"
                style={{
                  padding: '6px 10px',
                  fontSize: 10,
                  backgroundColor: '#6b7280',
                  borderColor: '#6b7280',
                  color: 'white'
                }}
              >
                Cancel & Retry
              </button>
            </div>
          ) : paymentStatus === 'completed' ? (
            <div style={{
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: '#d1fae5',
              color: '#065f46',
              borderRadius: 4,
              textAlign: 'center',
              border: '1px solid #10b981'
            }}>
              ✅ Payment Complete
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
