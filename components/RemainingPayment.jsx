'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'

export default function RemainingPayment({ order, onPaymentSuccess, onDelivered }) {
  const [phone, setPhone] = useState(order.customer.phone || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [paid, setPaid] = useState(order.payment.remainingPaid || false)
  const [deliveryStatus, setDeliveryStatus] = useState('idle')
  const [currentOrder, setCurrentOrder] = useState(order)

  const remainingAmount = order.payment.remainingAmount
  const totalAmount = order.totalAmount
  const depositAmount = order.payment.depositAmount

  const handlePayment = async () => {
    if (!phone) {
      setMessage('Please enter your phone number')
      return
    }

    setLoading(true)
    setMessage('Processing payment...')

    try {
      // For now, let's bypass M-Pesa and directly process the payment
      // This is for testing - in production you'd use the M-Pesa flow
      
      console.log('Bypassing M-Pesa for testing - directly processing payment')
      await processRemainingPayment(`TEST_${Date.now()}`)
      
      /* Original M-Pesa flow - commented out for testing
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          amount: remainingAmount
        })
      })

      const data = await response.json()

      if (data.success) {
        // Process the remaining payment in our system immediately
        await processRemainingPayment(data.reference || `PAY${Date.now()}`)
      } else {
        setMessage(data.message || 'Payment failed. Please try again.')
      }
      */
    } catch (error) {
      console.error('Payment error:', error)
      setMessage('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const processRemainingPayment = async (transactionId) => {
    try {
      console.log('Processing remaining payment:', { orderId: order.orderId, transactionId, amount: remainingAmount })
      
      const response = await fetch('/api/orders/pay-remaining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.orderId,
          transactionId,
          amount: remainingAmount
        })
      })

      const result = await response.json()
      console.log('Payment processing result:', result)

      if (result.success) {
        setMessage('Payment successful! Remaining amount confirmed.')
        setPaid(true)
        // Update the current order state
        const updatedOrder = { ...result.order }
        setCurrentOrder(updatedOrder)
        onPaymentSuccess(updatedOrder)
      } else {
        setMessage(result.error || 'Failed to process payment')
        setPaid(false)
      }
    } catch (err) {
      console.error('Payment processing error:', err)
      setMessage('Failed to process payment. Please contact support.')
      setPaid(false)
    }
  }

  const checkOrderStatus = async () => {
    try {
      const response = await fetch(`/api/orders/search?phone=${encodeURIComponent(order.customer.phone)}`)
      const result = await response.json()
      
      if (result.success) {
        const foundOrder = result.orders.find(o => o.orderId === order.orderId)
        if (foundOrder) {
          console.log('Current order in database:', foundOrder)
          console.log('Payment status:', foundOrder.payment)
          setCurrentOrder(foundOrder)
          setPaid(foundOrder.payment.remainingPaid)
        }
      }
    } catch (err) {
      console.error('Error checking order status:', err)
    }
  }

  const markAsDelivered = async () => {
    try {
      setDeliveryStatus('processing')
      setMessage('')

      // First check the current order status in database
      await checkOrderStatus()

      console.log('Marking as delivered:', { orderId: currentOrder.orderId, remainingPaid: currentOrder.payment?.remainingPaid, paid: paid })

      const response = await fetch('/api/orders/mark-delivered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: currentOrder.orderId
        })
      })

      const result = await response.json()
      console.log('Mark delivered result:', result)

      if (result.success) {
        setDeliveryStatus('completed')
        setCurrentOrder(result.order)
        onDelivered(result.order)
        
        // Automatically download the complete receipt PDF
        setTimeout(() => {
          downloadCompleteReceipt(result.order)
        }, 500) // Small delay to ensure UI updates first
      } else {
        setDeliveryStatus('failed')
        setMessage(result.error || 'Failed to mark as delivered')
      }
    } catch (err) {
      console.error('Mark delivered error:', err)
      setDeliveryStatus('failed')
      setMessage('Failed to mark as delivered. Please try again.')
    }
  }

  const downloadCompleteReceipt = async (orderData) => {
    const doc = new jsPDF()
    
    // Set font to match checkout page
    doc.setFont('courier', 'normal')
    
    // Header with website title (matching checkout format)
    doc.setFontSize(18)
    doc.text('SUPER TWICE RESELLERS', 105, 15, { align: 'center' })
    doc.setFontSize(16)
    doc.text('COMPLETED ORDER RECEIPT', 105, 25, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Order ID: ${orderData.orderId}`, 105, 35, { align: 'center' })
    
    // Customer name
    if (orderData.customer.name) {
      doc.setFontSize(10)
      doc.text(`Customer: ${orderData.customer.name}`, 20, 45)
    }
    
    // Line separator
    doc.line(20, 50, 190, 50)
    
    let yPosition = 60
    
    // Order Details Section
    doc.setFontSize(14)
    doc.text('ORDER DETAILS:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    
    // Process each item with image (matching checkout format)
    for (let index = 0; index < orderData.items.length; index++) {
      const item = orderData.items[index]
      
      // Add product image if available
      if (item.img) {
        try {
          // Convert image to base64 and add to PDF
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          await new Promise((resolve) => {
            img.onload = () => {
              canvas.width = 50
              canvas.height = 40
              ctx.drawImage(img, 0, 0, 50, 40)
              const imgData = canvas.toDataURL('image/jpeg', 0.8)
              doc.addImage(imgData, 'JPEG', 25, yPosition - 5, 20, 16)
              resolve()
            }
            img.onerror = () => resolve() // Skip image if error
            img.crossOrigin = 'anonymous'
            img.src = item.img
          })
          
          // Product details next to image
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 50, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 50, yPosition)
          yPosition += 15
        } catch (error) {
          // Fallback without image
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 25, yPosition)
          yPosition += 8
        }
      } else {
        // No image available
        doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
        yPosition += 5
        doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 25, yPosition)
        yPosition += 8
      }
    }
    
    yPosition += 5
    
    // Payment Summary Section (matching checkout format)
    doc.setFontSize(14)
    doc.text('PAYMENT SUMMARY:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.text(`Subtotal: Ksh ${Number(orderData.subtotal).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 5
    
    if (orderData.deliveryFee > 0) {
      doc.text(`Delivery Fee: Ksh ${Number(orderData.deliveryFee).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    
    doc.setFontSize(12)
    doc.text(`Total: Ksh ${Number(orderData.totalAmount).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    doc.text(`Deposit Paid: Ksh ${Number(orderData.payment.depositAmount).toLocaleString('en-KE')} ✓`, 25, yPosition)
    yPosition += 5
    doc.text(`Remaining Paid: Ksh ${Number(orderData.payment.remainingAmount).toLocaleString('en-KE')} ✓`, 25, yPosition)
    yPosition += 8
    
    // Payment completion status
    doc.setFontSize(10)
    doc.text('FULLY PAID - ORDER COMPLETED & DELIVERED', 25, yPosition)
    yPosition += 10
    
    // Completion details
    if (orderData.payment.remainingPaidAt) {
      doc.text(`Final Payment: ${new Date(orderData.payment.remainingPaidAt).toLocaleDateString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    if (orderData.delivery.actualDate) {
      doc.text(`Delivered: ${new Date(orderData.delivery.actualDate).toLocaleDateString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    
    // Footer (matching checkout format)
    yPosition += 10
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    doc.setFontSize(8)
    doc.text(`Generated on: ${new Date().toLocaleString('en-KE')}`, 105, yPosition, { align: 'center' })
    
    // Save the PDF
    doc.save(`Complete-Receipt-${orderData.orderId}.pdf`)
  }

  // Payment completed state - same style as checkout
  if (paid) {
    return (
      <div style={{
        border: '1px solid #253049',
        borderRadius: 8,
        padding: 20,
        backgroundColor: 'var(--card)',
        marginTop: 16
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>
          💰 Complete Payment & Delivery
        </h3>

        {/* Payment Breakdown - Same as checkout */}
        <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>💳 M-Pesa Payment (Remaining Balance)</h4>
          
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
              <span>Deposit (20%):</span>
              <span>Ksh {depositAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--primary)' }}>
              <span>Balance (on delivery):</span>
              <span><strong>Ksh {remainingAmount.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Phone Number - Locked */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--muted)' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
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
              Remaining amount of Ksh {remainingAmount.toLocaleString()} confirmed.
              <br />
              You can now confirm delivery below.
            </div>
          </div>
        </div>

        {/* Delivery Confirmation Section */}
        {currentOrder.status !== 'delivered' && (
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
              Complete Order
            </h4>
            <div style={{
              padding: 12,
              backgroundColor: 'rgba(111, 66, 193, 0.1)',
              borderRadius: 6,
              marginBottom: 12
            }}>
              <div style={{ fontSize: 14, marginBottom: 4, fontWeight: 600, color: '#6f42c1' }}>
                🎯 Ready to Complete Order
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                Payment confirmed! Click below to finalize your order and receive your complete receipt.
              </div>
              <div style={{ fontSize: 11, color: '#6f42c1' }}>
                This will mark your order as delivered and generate your final receipt.
              </div>
            </div>

            {deliveryStatus === 'idle' && (
              <div>
                <button
                  onClick={markAsDelivered}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '12px',
                    backgroundColor: '#6f42c1',
                    borderColor: '#6f42c1',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  🎉 Complete Order & Download Receipt
                </button>
              </div>
            )}

            {deliveryStatus === 'processing' && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>⏳</div>
                <div>Confirming delivery...</div>
              </div>
            )}

            {deliveryStatus === 'failed' && (
              <div>
                <div style={{
                  padding: 12,
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  borderRadius: 6,
                  marginBottom: 12,
                  color: '#dc3545'
                }}>
                  {message}
                </div>
                <button
                  onClick={markAsDelivered}
                  className="btn"
                  style={{ width: '100%', padding: '12px' }}
                >
                  🔄 Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Order Completed */}
        {currentOrder.status === 'delivered' && (
          <div>
            <div style={{
              textAlign: 'center',
              padding: 20,
              backgroundColor: 'rgba(111, 66, 193, 0.1)',
              borderRadius: 6,
              marginBottom: 16
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#6f42c1', marginBottom: 4 }}>
                Order Successfully Completed!
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                Thank you for your purchase. Your order has been successfully delivered and all payments have been completed.
              </div>
              <div style={{ fontSize: 11, color: '#6f42c1', fontWeight: 600 }}>
                ✅ Full Payment Confirmed • 📦 Delivery Completed • 📋 Order Closed
              </div>
            </div>

            {/* Download Complete Receipt Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => downloadCompleteReceipt(currentOrder)}
                className="btn btn-primary"
                style={{
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: '#6f42c1',
                  borderColor: '#6f42c1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📄 Download Complete Receipt
              </button>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
                Complete receipt with all payment details and delivery confirmation
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Payment form - same style as checkout
  return (
    <div style={{
      border: '1px solid #253049',
      borderRadius: 8,
      padding: 20,
      backgroundColor: 'var(--card)',
      marginTop: 16
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>
        💰 Complete Payment & Delivery
      </h3>

      <div style={{ border: '1px solid #2a3342', borderRadius: 4, padding: '12px', backgroundColor: 'var(--surface)' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>💳 M-Pesa Payment (Remaining Balance)</h4>
        
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
            <span>Deposit (20%):</span>
            <span>Ksh {depositAmount.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--primary)' }}>
            <span>Balance (on delivery):</span>
            <span><strong>Ksh {remainingAmount.toLocaleString()}</strong></span>
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
                style={{
                  width: '100%',
                  padding: '10px 8px',
                  borderRadius: 4,
                  border: '1px solid #3a465c',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '12px',
                  boxSizing: 'border-box'
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
            <button
              onClick={handlePayment}
              disabled={loading || !phone}
              className="btn"
              style={{
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                opacity: loading || !phone ? 0.5 : 1,
                cursor: loading || !phone ? 'not-allowed' : 'pointer',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxSizing: 'border-box'
              }}
            >
              {loading ? (
                <>
                  <span style={{ fontSize: '10px' }}>⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '10px' }}>💳</span>
                  <span>Pay Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
