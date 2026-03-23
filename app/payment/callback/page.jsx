'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../components/AuthContext'

function PaymentCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Processing payment...')
  const [reference, setReference] = useState('')

  useEffect(() => {
    const reference = searchParams.get('reference')
    if (!reference) {
      setStatus('error')
      setMessage('No payment reference found')
      return
    }

    setReference(reference)
    verifyPayment(reference)
  }, [searchParams])

  const verifyPayment = async (reference) => {
    try {
      console.log('🔍 Verifying Paystack payment:', reference)
      
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      })

      const data = await response.json()
      console.log('📊 Payment verification response:', data)

      if (data.success && data.status === 'paid') {
        const paymentType = data.transaction?.metadata?.paymentType
        const remainingOrderId = data.transaction?.metadata?.orderId

        // Remaining balance payment flow (My Orders)
        if (paymentType === 'remaining' && remainingOrderId) {
          try {
            setStatus('success')
            setMessage('🎉 Payment completed successfully!')

            const amount = Number(data.transaction?.metadata?.remainingAmount) || Number(data.transaction?.amount)

            const markResponse = await fetch('/api/orders/pay-remaining', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: remainingOrderId,
                transactionId: reference,
                amount
              })
            })

            const markResult = await markResponse.json()

            if (!markResponse.ok || !markResult.success) {
              setStatus('error')
              setMessage(markResult?.error || '❌ Unable to apply payment to your order. Please contact support.')
              setTimeout(() => {
                router.push(`/my-orders/${encodeURIComponent(remainingOrderId)}?payment=error`)
              }, 3000)
              return
            }

            // Redirect back to order details after a short delay
            setTimeout(() => {
              router.push(`/my-orders/${encodeURIComponent(remainingOrderId)}?payment=success`)
            }, 2500)

            return
          } catch (e) {
            console.error('💥 Remaining payment post-processing error:', e)
            setStatus('error')
            setMessage('❌ Payment verified but order update failed. Please contact support.')
            setTimeout(() => {
              router.push(`/my-orders/${encodeURIComponent(remainingOrderId)}?payment=error`)
            }, 3000)
            return
          }
        }

        setStatus('success')
        setMessage('🎉 Payment completed successfully!')
        
        // Store payment info in localStorage for the checkout process
        localStorage.setItem('paymentStatus', 'paid')
        localStorage.setItem('paymentReference', reference)
        localStorage.setItem('paidAmount', data.transaction.amount)
        localStorage.setItem('paymentMethod', 'paystack')
        
        // Store detailed payment record for checkout
        const paymentRecord = {
          paymentReference: reference,
          paymentMethod: 'paystack',
          depositPaid: true,
          paidAmount: data.transaction.amount / 100, // Convert from kobo to KES
          totalAmount: data.transaction.metadata?.totalAmount || data.transaction.amount / 100,
          balanceAmount: data.transaction.metadata?.balanceAmount || 0,
          customerEmail: data.transaction.customer?.email,
          customerPhone: data.transaction.metadata?.phone,
          userId: data.transaction.metadata?.userId,
          paymentDate: new Date().toISOString(),
          transactionDetails: data.transaction
        }
        
        // Store payment record for SimplePayment component to detect
        localStorage.setItem('paystackPayment', JSON.stringify(paymentRecord))
        
        // Also store recent payment attempt for PaymentStatusChecker
        const recentAttempts = JSON.parse(localStorage.getItem('recentPaymentAttempts') || '[]')
        recentAttempts.push({
          checkoutRequestId: reference,
          timestamp: new Date().toISOString(),
          paymentMethod: 'paystack'
        })
        localStorage.setItem('recentPaymentAttempts', JSON.stringify(recentAttempts))
        
        console.log('💾 Payment record stored for checkout:', paymentRecord)
        
        // Redirect back to checkout after a short delay
        setTimeout(() => {
          router.push('/checkout?payment=success')
        }, 3000)
        
      } else if (data.success && data.status === 'failed') {
        setStatus('failed')
        setMessage('❌ Payment failed. Please try again.')
        
        // Redirect back to checkout after a short delay
        setTimeout(() => {
          router.push('/checkout?payment=failed')
        }, 3000)
        
      } else {
        setStatus('pending')
        setMessage('⏳ Payment is still being processed. Please wait...')
        
        // Poll again after a few seconds
        setTimeout(() => {
          verifyPayment(reference)
        }, 5000)
      }
      
    } catch (error) {
      console.error('💥 Payment verification error:', error)
      setStatus('error')
      setMessage('❌ Unable to verify payment. Please contact support.')
      
      setTimeout(() => {
        router.push('/checkout?payment=error')
      }, 3000)
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success': return '#059669'
      case 'failed': return '#dc2626'
      case 'error': return '#dc2626'
      case 'pending': return '#d97706'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return '🎉'
      case 'failed': return '❌'
      case 'error': return '⚠️'
      case 'pending': return '⏳'
      default: return '🔄'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        padding: '40px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {getStatusIcon()}
        </div>
        
        <h1 style={{
          margin: '0 0 16px 0',
          fontSize: '24px',
          fontWeight: '600',
          color: 'var(--text)'
        }}>
          Payment Status
        </h1>
        
        <div style={{
          fontSize: '16px',
          color: getStatusColor(),
          marginBottom: '16px',
          fontWeight: '500'
        }}>
          {message}
        </div>
        
        {reference && (
          <div style={{
            fontSize: '12px',
            color: 'var(--muted)',
            marginBottom: '24px'
          }}>
            Reference: {reference}
          </div>
        )}
        
        {status === 'pending' && (
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid var(--border)',
            borderTop: `2px solid ${getStatusColor()}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        )}
        
        {status === 'success' && (
          <div style={{
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: 1.4
          }}>
            Redirecting you back to checkout...
          </div>
        )}
        
        {(status === 'failed' || status === 'error') && (
          <button
            onClick={() => router.push('/checkout')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Return to Checkout
          </button>
        )}
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

export default function PaymentCallback() {
  return (
    <Suspense>
      <PaymentCallbackInner />
    </Suspense>
  )
}
