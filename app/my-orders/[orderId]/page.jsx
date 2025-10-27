'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { jsPDF } from 'jspdf'
import RemainingPayment from '../../../components/RemainingPayment'

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId)
    }
  }, [orderId])

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchOrderDetails = async (id) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching order details for:', id)
      const response = await fetch(`/api/orders/details?orderId=${encodeURIComponent(id)}`)
      console.log('Response status:', response.status)
      
      const result = await response.json()
      console.log('Response data:', result)
      
      if (result.success) {
        setOrder(result.order)
      } else {
        setError(result.error || 'Order not found')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to fetch order details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return '#ffc107'
      case 'in_transit': return '#fd7e14'
      case 'receiving': return '#28a745'
      case 'delivered': return '#6f42c1'
      case 'confirmed': return '#28a745'
      case 'shipped': return '#17a2b8'
      case 'completed': return '#6f42c1'
      case 'cancelled': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return '⚙️'
      case 'in_transit': return '🚚'
      case 'receiving': return '📦'
      case 'delivered': return '📋'
      case 'confirmed': return '✅'
      case 'shipped': return '🚚'
      case 'completed': return '🎉'
      case 'cancelled': return '❌'
      default: return '📋'
    }
  }

  const downloadReceiptAsPDF = async (order) => {
    const doc = new jsPDF()
    
    // Set font
    doc.setFont('courier', 'normal')
    
    // Header with website title
    doc.setFontSize(18)
    doc.text('SUPER TWICE RESELLERS', 105, 15, { align: 'center' })
    doc.setFontSize(16)
    doc.text('ORDER RECEIPT', 105, 25, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Order ID: ${order.orderId}`, 105, 35, { align: 'center' })
    doc.setFontSize(10)
    doc.text(`Order Date: ${formatDate(order.orderDate)}`, 20, 43)
    
    // Line separator
    doc.line(20, 48, 190, 48)
    
    let yPosition = 58
    
    // Order Details Section
    doc.setFontSize(14)
    doc.text('ORDER DETAILS:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    
    // Process each item with image
    for (let index = 0; index < order.items.length; index++) {
      const item = order.items[index]
      
      // Add product image if available
      if (item.img) {
        try {
          // Convert image to base64 and add to PDF
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              canvas.width = 50
              canvas.height = 40
              ctx.drawImage(img, 0, 0, 50, 40)
              const imgData = canvas.toDataURL('image/jpeg', 0.8)
              doc.addImage(imgData, 'JPEG', 25, yPosition - 5, 20, 16)
              resolve()
            }
            img.onerror = () => {
              console.log('Failed to load image:', item.img)
              resolve() // Continue without image
            }
            img.crossOrigin = 'anonymous'
            img.src = item.img
          })
          
          // Product details next to image
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 50, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${item.price.toLocaleString('en-KE')} = Ksh ${item.lineTotal.toLocaleString('en-KE')}`, 50, yPosition)
          yPosition += 15
        } catch (error) {
          console.error('Error adding image to PDF:', error)
          // Fallback without image
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${item.price.toLocaleString('en-KE')} = Ksh ${item.lineTotal.toLocaleString('en-KE')}`, 25, yPosition)
          yPosition += 10
        }
      } else {
        // No image available
        doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
        yPosition += 5
        doc.text(`   Qty: ${item.quantity} × Ksh ${item.price.toLocaleString('en-KE')} = Ksh ${item.lineTotal.toLocaleString('en-KE')}`, 25, yPosition)
        yPosition += 10
      }
    }
    
    // Payment Summary
    yPosition += 10
    doc.setFontSize(14)
    doc.text('PAYMENT SUMMARY:', 20, yPosition)
    yPosition += 12
    
    doc.setFontSize(10)
    doc.text(`Subtotal: Ksh ${order.subtotal.toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 6
    
    if (order.deliveryFee > 0) {
      doc.text(`Delivery Fee: Ksh ${order.deliveryFee.toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 6
    }
    
    doc.text(`Total: Ksh ${order.totalAmount.toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 6
    doc.text(`Deposit Paid: Ksh ${order.payment.depositAmount.toLocaleString('en-KE')} ✅`, 25, yPosition)
    yPosition += 6
    doc.text(`Remaining: Ksh ${order.payment.remainingAmount.toLocaleString('en-KE')} (Cash on Delivery)`, 25, yPosition)
    
    // Customer Details
    yPosition += 20
    doc.setFontSize(14)
    doc.text('CUSTOMER DETAILS:', 20, yPosition)
    yPosition += 12
    
    doc.setFontSize(10)
    doc.text(`Name: ${order.customer.name}`, 25, yPosition)
    yPosition += 8
    doc.text(`Phone: ${order.customer.phone}`, 25, yPosition)
    
    // Check if we need a new page (if content goes beyond page height)
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
      doc.setFontSize(10)
      doc.text('--- Continued ---', 105, yPosition, { align: 'center' })
    }
    
    // Save the PDF
    doc.save(`Order-${order.orderId}-Receipt.pdf`)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--muted)' }}>Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>❌</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#dc3545' }}>Error</h2>
          <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>{error}</p>
          <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--muted)' }}>
            Order ID: {orderId}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/my-orders" className="btn btn-primary">
              Back to My Orders
            </Link>
            <button 
              onClick={() => fetchOrderDetails(orderId)}
              className="btn"
              style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>📋</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Order Not Found</h2>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--muted)' }}>
            The requested order could not be found.
          </p>
          <Link href="/my-orders" className="btn btn-primary">
            Back to My Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: windowWidth <= 768 ? '32px 12px 16px' : '16px 12px' 
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>📦 Order Details</h1>
        <Link href="/my-orders" className="btn" style={{ padding: '6px 10px', fontSize: '12px' }}>
          Back to My Orders
        </Link>
      </div>

      {/* Order Details Card */}
      <div style={{
        border: '1px solid #253049',
        borderRadius: 6,
        padding: 16,
        backgroundColor: 'var(--card)',
        marginBottom: 16
      }}>
        {/* Order Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
              Order #{order.orderId}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
              Placed on {formatDate(order.orderDate)}
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            backgroundColor: getStatusColor(order.status),
            color: 'white',
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 600
          }}>
            {getStatusIcon(order.status)} {order.status.toUpperCase()}
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
            📋 Items Ordered
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {order.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 8,
                  backgroundColor: 'rgba(42, 51, 66, 0.1)',
                  borderRadius: 4
                }}
              >
                {item.img && (
                  <img
                    src={item.img}
                    alt={item.name}
                    style={{
                      width: 50,
                      height: 40,
                      objectFit: 'cover',
                      borderRadius: 4
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {item.condition} • Qty: {item.quantity} × Ksh {item.price.toLocaleString('en-KE')}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                  Ksh {item.lineTotal.toLocaleString('en-KE')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Delivery Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Payment Summary */}
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
              💰 Payment Summary
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>Ksh {order.subtotal.toLocaleString('en-KE')}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery:</span>
                  <span>Ksh {order.deliveryFee.toLocaleString('en-KE')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid #253049', paddingTop: 6, marginTop: 6 }}>
                <span>Total:</span>
                <span>Ksh {order.totalAmount.toLocaleString('en-KE')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745', marginTop: 3 }}>
                <span>Deposit Paid:</span>
                <span>Ksh {order.payment.depositAmount.toLocaleString('en-KE')} ✅</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffc107', marginTop: 3 }}>
                <span>Remaining:</span>
                <span>Ksh {order.payment.remainingAmount.toLocaleString('en-KE')}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
              {order.delivery.method === 'delivery' ? '🚚 Delivery Info' : '🏪 Pickup Info'}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
              <div><strong>Method:</strong> {order.delivery.method === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</div>
              <div><strong>Customer:</strong> {order.customer.name}</div>
              <div><strong>Phone:</strong> {order.customer.phone}</div>
              {order.customer.address && (
                <div><strong>Address:</strong> {order.customer.address.street}</div>
              )}
              {order.delivery.estimatedDate && (
                <div><strong>Expected:</strong> {formatDate(order.delivery.estimatedDate)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Remaining Payment & Delivery Confirmation */}
        {order.status === 'receiving' && (
          <RemainingPayment 
            order={order}
            onPaymentSuccess={(updatedOrder) => setOrder(updatedOrder)}
            onDelivered={(updatedOrder) => setOrder(updatedOrder)}
          />
        )}

      </div>
    </div>
  )
}
