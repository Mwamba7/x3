"use client"

import { useState, useEffect } from 'react'
import { useCart } from './CartContext'
import { useAuth } from './AuthContext'

export default function SimplePayment({ totalAmount, subtotalAmount, deliveryFee, totalCount, onPaymentComplete, disabled = false, paymentCompleted = false, savedPaymentPhone = '' }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [paid, setPaid] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('idle') // idle, processing, completed, failed
  const { lockCart } = useCart()

  const depositAmount = Math.round(totalAmount * 0.2) // 20% deposit
  const balanceAmount = totalAmount - depositAmount

  // Check if payment was already completed (from Paystack callback)
  useEffect(() => {
    const checkPaymentStatus = () => {
      try {
        const savedPayment = localStorage.getItem('paystackPayment')
        if (savedPayment) {
          const paymentData = JSON.parse(savedPayment)
          if (paymentData.depositPaid === true && paymentData.paymentMethod === 'paystack') {
            console.log('💳 Found completed Paystack payment:', paymentData)
            setPaid(true)
            setPaymentStatus('completed')
            setMessage('✅ Deposit payment completed successfully')
            
            // Lock the cart to prevent further modifications
            if (lockCart) {
              lockCart(true)
            }
            
            // Notify parent component if callback provided
            if (onPaymentComplete) {
              onPaymentComplete(paymentData)
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking payment status:', error)
      }
    }
    
    checkPaymentStatus()
  }, [lockCart, onPaymentComplete])

  // Retry payment function
  const retryPayment = () => {
    setLoading(false)
    setMessage('')
    setPaymentStatus('idle')
    console.log('🔄 Payment retry - clearing previous state')
  }

  const handlePayment = async () => {
    if (disabled) {
      setMessage('Please complete delivery details first')
      return
    }

    // Get user email from auth context or use a default
    const userEmail = user?.email || 'customer@example.com'

    setLoading(true)
    setPaymentStatus('processing')
    setMessage('🔄 Initializing payment...')

    try {
      console.log('💳 Initiating Paystack payment for amount:', depositAmount)
      
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          phone: user?.phone || '', // Include phone if available but don't require it
          amount: depositAmount,
          reference: `DEP${Date.now()}`,
          metadata: {
            orderType: 'deposit',
            totalAmount: totalAmount,
            depositAmount: depositAmount,
            balanceAmount: balanceAmount,
            userId: user?.id
          }
        })
      })

      const data = await response.json()
      console.log('📊 Paystack response:', data)

      if (data.success && data.authorization_url) {
        setMessage('🌐 Redirecting to secure payment page...')
        
        // Redirect to Paystack payment page
        window.location.href = data.authorization_url
      } else {
        console.error('❌ Paystack initialization failed:', data)
        
        // Provide more specific error messages based on the error type
        let errorMessage = data.error || 'Failed to initialize payment. Please try again.'
        
        if (data.error === 'Payment service temporarily unavailable') {
          errorMessage = '❌ Paystack service is temporarily unavailable. This may be due to:\n• Missing Paystack configuration\n• Network issues with Paystack servers\n• Service maintenance\n\nPlease try again in a few minutes or contact support.'
        } else if (data.error === 'Paystack service not properly configured') {
          errorMessage = '❌ Paystack payment service is not configured. Please contact the administrator to set up Paystack integration.'
        } else if (data.error && data.error.includes('Invalid')) {
          errorMessage = '❌ Invalid payment details. Please check your information and try again.'
        }
        
        setMessage(errorMessage)
        setPaymentStatus('failed')
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 Payment request error:', error)
      
      // Provide more specific error messages for network/configuration issues
      let errorMessage = '❌ Network error. Please check your connection and try again.'
      
      if (error.message && error.message.includes('fetch')) {
        errorMessage = '❌ Unable to connect to payment service. Please check your internet connection and try again.'
      } else if (error.name === 'TypeError' && error.message.includes('JSON')) {
        errorMessage = '❌ Payment service response error. Please try again or contact support.'
      }
      
      setMessage(errorMessage)
      setPaymentStatus('failed')
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>💳 Paystack Payment (20% Deposit)</h3>
        
        <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Total Amount:</span>
            <span style={{ fontWeight: '500' }}>Ksh {totalAmount.toLocaleString('en-KE')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Deposit (20%):</span>
            <span style={{ fontWeight: '500', color: 'var(--primary)' }}>Ksh {depositAmount.toLocaleString('en-KE')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)' }}>Balance (on delivery):</span>
            <span style={{ fontWeight: '500' }}>Ksh {balanceAmount.toLocaleString('en-KE')}</span>
          </div>
        </div>

        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <div style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }}>
            ✅ Deposit payment completed successfully
          </div>
          <div style={{ fontSize: '10px', color: '#059669', marginTop: '4px' }}>
            Balance of Ksh {balanceAmount.toLocaleString('en-KE')} will be collected on delivery
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)', marginTop: '12px' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>💳 Paystack Payment (20% Deposit)</h3>
      
      {/* Payment Breakdown */}
      <div style={{
        backgroundColor: 'rgba(42, 51, 66, 0.1)',
        padding: '8px',
        borderRadius: 4,
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span>Total Amount:</span>
          <span>Ksh {totalAmount.toLocaleString('en-KE')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
          <span>Deposit (20%):</span>
          <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Ksh {depositAmount.toLocaleString('en-KE')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span>Balance (on delivery):</span>
          <span>Ksh {balanceAmount.toLocaleString('en-KE')}</span>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '8px',
          borderRadius: '4px',
          fontSize: '11px',
          marginBottom: '12px',
          backgroundColor: paymentStatus === 'failed' ? 'rgba(220, 38, 38, 0.1)' : 
                           paymentStatus === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 
                           'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${paymentStatus === 'failed' ? 'rgba(220, 38, 38, 0.2)' : 
                                paymentStatus === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 
                                'rgba(59, 130, 246, 0.2)'}`,
          color: paymentStatus === 'failed' ? '#dc2626' : 
                 paymentStatus === 'completed' ? '#059669' : 
                 '#3b82f6',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </div>
      )}

      {/* Pay Now Button - Centered */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {paymentStatus === 'idle' || paymentStatus === 'failed' ? (
          <button
            onClick={handlePayment}
            disabled={loading || disabled}
            className="btn"
            style={{
              padding: '8px 40px',
              fontSize: '15px',
              fontWeight: '500',
              borderRadius: '6px',
              border: 'none',
              cursor: loading || disabled ? 'not-allowed' : 'pointer',
              backgroundColor: loading || disabled ? 'var(--border)' : 'var(--primary)',
              color: loading || disabled ? 'var(--muted)' : 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading || disabled ? 0.7 : 1,
              transition: 'all 0.2s ease',
              minWidth: '300px',
              justifyContent: 'center'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Processing...</span>
              </>
            ) : paymentStatus === 'failed' ? (
              <>
                <span style={{ fontSize: '12px' }}>🔄</span>
                <span>Retry Payment</span>
              </>
            ) : (
              <>
                <span>Pay Now</span>
                <span style={{ fontSize: '12px' }}>💳</span>
              </>
            )}
          </button>
        ) : paymentStatus === 'processing' ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Processing...</span>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
