'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { jsPDF } from 'jspdf'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

  const orderStages = [
    { value: 'processing', label: 'Processing', color: '#ffc107', icon: '⚙️' },
    { value: 'in_transit', label: 'In Transit', color: '#fd7e14', icon: '🚚' },
    { value: 'receiving', label: 'Receiving', color: '#28a745', icon: '📦' },
    { value: 'delivered', label: 'Delivered', color: '#6f42c1', icon: '📋' }
  ]

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/orders')
      const result = await response.json()
      
      if (result.success) {
        setOrders(result.orders)
      } else {
        setError(result.error || 'Failed to fetch orders')
      }
    } catch (err) {
      setError('Failed to fetch orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, status: newStatus })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update the order in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        )
        // Exit edit mode after successful update
        setEditingOrder(null)
      } else {
        alert('Failed to update order status: ' + result.error)
      }
    } catch (err) {
      alert('Failed to update order status. Please try again.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const toggleEditMode = (orderId) => {
    setEditingOrder(editingOrder === orderId ? null : orderId)
  }

  const getStageInfo = (status) => {
    return orderStages.find(stage => stage.value === status) || orderStages[0]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Download initial order receipt (deposit payment)
  const downloadOrderReceipt = async (order) => {
    const doc = new jsPDF()
    
    // Set font to match checkout page
    doc.setFont('courier', 'normal')
    
    // Header with website title
    doc.setFontSize(18)
    doc.text('SUPER TWICE RESELLERS', 105, 15, { align: 'center' })
    doc.setFontSize(16)
    doc.text('ORDER RECEIPT', 105, 25, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Order ID: ${order.orderId}`, 105, 35, { align: 'center' })
    
    // Customer name
    if (order.customer.name) {
      doc.setFontSize(10)
      doc.text(`Customer: ${order.customer.name}`, 20, 45)
    }
    
    // Line separator
    doc.line(20, 50, 190, 50)
    
    let yPosition = 60
    
    // Order Details Section
    doc.setFontSize(14)
    doc.text('ORDER DETAILS:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    
    // Process each item
    for (let index = 0; index < order.items.length; index++) {
      const item = order.items[index]
      
      // Add product image if available
      if (item.img) {
        try {
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
            img.onerror = () => resolve()
            img.crossOrigin = 'anonymous'
            img.src = item.img
          })
          
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 50, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 50, yPosition)
          yPosition += 15
        } catch (error) {
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 25, yPosition)
          yPosition += 8
        }
      } else {
        doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
        yPosition += 5
        doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 25, yPosition)
        yPosition += 8
      }
    }
    
    yPosition += 5
    
    // Payment Summary Section
    doc.setFontSize(14)
    doc.text('PAYMENT SUMMARY:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.text(`Subtotal: Ksh ${Number(order.subtotal).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 5
    
    if (order.deliveryFee > 0) {
      doc.text(`Delivery Fee: Ksh ${Number(order.deliveryFee).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    
    doc.setFontSize(12)
    doc.text(`Total: Ksh ${Number(order.totalAmount).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    doc.text(`Deposit Paid: Ksh ${Number(order.payment.depositAmount).toLocaleString('en-KE')} ✓`, 25, yPosition)
    yPosition += 5
    doc.text(`Remaining: Ksh ${Number(order.payment.remainingAmount).toLocaleString('en-KE')} (Cash on Delivery)`, 25, yPosition)
    
    // Footer
    yPosition += 15
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    doc.setFontSize(8)
    doc.text(`Generated on: ${new Date().toLocaleString('en-KE')}`, 105, yPosition, { align: 'center' })
    
    // Download the PDF
    doc.save(`Order-Receipt-${order.orderId}.pdf`)
  }

  // Download completed order receipt (full payment)
  const downloadCompletedReceipt = async (order) => {
    const doc = new jsPDF()
    
    // Set font to match checkout page
    doc.setFont('courier', 'normal')
    
    // Header with website title
    doc.setFontSize(18)
    doc.text('SUPER TWICE RESELLERS', 105, 15, { align: 'center' })
    doc.setFontSize(16)
    doc.text('COMPLETED ORDER RECEIPT', 105, 25, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Order ID: ${order.orderId}`, 105, 35, { align: 'center' })
    
    // Customer name
    if (order.customer.name) {
      doc.setFontSize(10)
      doc.text(`Customer: ${order.customer.name}`, 20, 45)
    }
    
    // Line separator
    doc.line(20, 50, 190, 50)
    
    let yPosition = 60
    
    // Order Details Section
    doc.setFontSize(14)
    doc.text('ORDER DETAILS:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    
    // Process each item
    for (let index = 0; index < order.items.length; index++) {
      const item = order.items[index]
      
      // Add product image if available
      if (item.img) {
        try {
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
            img.onerror = () => resolve()
            img.crossOrigin = 'anonymous'
            img.src = item.img
          })
          
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 50, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 50, yPosition)
          yPosition += 15
        } catch (error) {
          doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
          yPosition += 5
          doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 25, yPosition)
          yPosition += 8
        }
      } else {
        doc.text(`${index + 1}. ${item.name} (${item.condition || 'good'})`, 25, yPosition)
        yPosition += 5
        doc.text(`   Qty: ${item.quantity} × Ksh ${Number(item.price).toLocaleString('en-KE')} = Ksh ${Number(item.quantity * item.price).toLocaleString('en-KE')}`, 25, yPosition)
        yPosition += 8
      }
    }
    
    yPosition += 5
    
    // Payment Summary Section
    doc.setFontSize(14)
    doc.text('PAYMENT SUMMARY:', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.text(`Subtotal: Ksh ${Number(order.subtotal).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 5
    
    if (order.deliveryFee > 0) {
      doc.text(`Delivery Fee: Ksh ${Number(order.deliveryFee).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    
    doc.setFontSize(12)
    doc.text(`Total: Ksh ${Number(order.totalAmount).toLocaleString('en-KE')}`, 25, yPosition)
    yPosition += 7
    
    doc.setFontSize(10)
    doc.text(`Deposit Paid: Ksh ${Number(order.payment.depositAmount).toLocaleString('en-KE')} ✓`, 25, yPosition)
    yPosition += 5
    doc.text(`Remaining Paid: Ksh ${Number(order.payment.remainingAmount).toLocaleString('en-KE')} ✓`, 25, yPosition)
    yPosition += 8
    
    // Payment completion status
    doc.setFontSize(10)
    doc.text('FULLY PAID - ORDER COMPLETED & DELIVERED', 25, yPosition)
    yPosition += 10
    
    // Completion details
    if (order.payment.remainingPaidAt) {
      doc.text(`Final Payment: ${new Date(order.payment.remainingPaidAt).toLocaleDateString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    if (order.delivery && order.delivery.actualDate) {
      doc.text(`Delivered: ${new Date(order.delivery.actualDate).toLocaleDateString('en-KE')}`, 25, yPosition)
      yPosition += 5
    }
    
    // Footer
    yPosition += 10
    doc.line(20, yPosition, 190, yPosition)
    yPosition += 10
    doc.setFontSize(8)
    doc.text(`Generated on: ${new Date().toLocaleString('en-KE')}`, 105, yPosition, { align: 'center' })
    
    // Save the PDF
    doc.save(`Complete-Receipt-${order.orderId}.pdf`)
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--muted)' }}>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🛍️ Order Management</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchOrders} className="btn" style={{ padding: '8px 12px', fontSize: '14px' }}>
            🔄 Refresh
          </button>
          <Link href="/admin" className="btn" style={{ padding: '8px 12px', fontSize: '14px', textDecoration: 'none' }}>
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          All Orders ({orders.length})
        </button>
        {orderStages.map(stage => {
          const count = orders.filter(order => order.status === stage.value).length
          return (
            <button
              key={stage.value}
              onClick={() => setFilter(stage.value)}
              className={`btn ${filter === stage.value ? 'btn-primary' : ''}`}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {stage.icon} {stage.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: 16,
          backgroundColor: '#dc3545',
          color: 'white',
          borderRadius: 8,
          marginBottom: 20,
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOrders.map((order) => {
            const stageInfo = getStageInfo(order.status)
            return (
              <div
                key={order._id}
                style={{
                  border: '1px solid #253049',
                  borderRadius: 8,
                  padding: 20,
                  backgroundColor: 'var(--card)'
                }}
              >
                {/* Order Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600 }}>
                      Order #{order.orderId}
                    </h3>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
                      Placed on {formatDate(order.orderDate)}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    backgroundColor: stageInfo.color,
                    color: 'white',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    {stageInfo.icon} {stageInfo.label}
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                    👤 Customer Information
                  </h4>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>
                    <div><strong>Name:</strong> {order.customer.name}</div>
                    <div><strong>Phone:</strong> {order.customer.phone}</div>
                    {order.customer.address && (
                      <div><strong>Address:</strong> {order.customer.address.street}</div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                    📋 Order Items
                  </h4>
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
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {item.condition} • Qty: {item.quantity} × Ksh {item.price.toLocaleString('en-KE')}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                          Ksh {item.lineTotal.toLocaleString('en-KE')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                    💰 Payment Summary
                  </h4>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Amount:</span>
                      <span>Ksh {order.totalAmount.toLocaleString('en-KE')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745' }}>
                      <span>Deposit Paid:</span>
                      <span>Ksh {order.payment.depositAmount.toLocaleString('en-KE')} ✅</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffc107' }}>
                      <span>Remaining:</span>
                      <span>Ksh {order.payment.remainingAmount.toLocaleString('en-KE')}</span>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                <div style={{ 
                  padding: 16, 
                  backgroundColor: 'rgba(42, 51, 66, 0.1)', 
                  borderRadius: 6,
                  marginBottom: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                      🔄 Update Order Status
                    </h4>
                    {/* Show edit button only for delivered orders */}
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => toggleEditMode(order.orderId)}
                        className="btn"
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          backgroundColor: editingOrder === order.orderId ? '#dc3545' : '#6c757d',
                          borderColor: editingOrder === order.orderId ? '#dc3545' : '#6c757d',
                          color: 'white'
                        }}
                      >
                        {editingOrder === order.orderId ? '🔒 Lock' : '✏️ Edit'}
                      </button>
                    )}
                  </div>
                  
                  {/* Show lock message for delivered orders when not in edit mode */}
                  {order.status === 'delivered' && editingOrder !== order.orderId && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      borderRadius: 4,
                      marginBottom: 12,
                      fontSize: 12,
                      color: '#dc3545'
                    }}>
                      🔒 Order is delivered and locked. Click "Edit" to make changes.
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {orderStages.map(stage => {
                      // Check if button should be disabled
                      const isDeliveredAndLocked = order.status === 'delivered' && editingOrder !== order.orderId
                      const isDisabled = updatingOrder === order.orderId || 
                                        order.status === stage.value || 
                                        isDeliveredAndLocked
                      
                      return (
                        <button
                          key={stage.value}
                          onClick={() => updateOrderStatus(order.orderId, stage.value)}
                          disabled={isDisabled}
                          className="btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: order.status === stage.value ? stage.color : 'var(--secondary)',
                            borderColor: order.status === stage.value ? stage.color : 'var(--secondary)',
                            color: order.status === stage.value ? 'white' : 'var(--text)',
                            opacity: isDisabled ? 0.4 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {updatingOrder === order.orderId ? '⏳' : stage.icon} {stage.label}
                        </button>
                      )
                    })}
                  </div>
                  
                  {/* Show warning when in edit mode */}
                  {order.status === 'delivered' && editingOrder === order.orderId && (
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 193, 7, 0.1)',
                      borderRadius: 4,
                      marginTop: 12,
                      fontSize: 11,
                      color: '#856404'
                    }}>
                      ⚠️ Edit mode enabled. You can now change the order status. Click "Lock" when done.
                    </div>
                  )}
                </div>

                {/* Receipt Downloads */}
                <div style={{ 
                  padding: 16, 
                  backgroundColor: 'rgba(42, 51, 66, 0.1)', 
                  borderRadius: 6 
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
                    📄 Download Receipts
                  </h4>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--muted)' }}>
                    Download receipts for record keeping and customer service
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Order Receipt - Available when deposit is paid (processing status and above) */}
                    {(order.status === 'processing' || order.status === 'in_transit' || order.status === 'receiving' || order.status === 'delivered') && (
                      <button
                        onClick={() => downloadOrderReceipt(order)}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#dc2626',
                          borderColor: '#dc2626',
                          color: 'white'
                        }}
                      >
                        📄 Order Receipt
                      </button>
                    )}
                    
                    {/* Completed Receipt - Available only when order is delivered (remaining payment made) */}
                    {order.status === 'delivered' && (
                      <button
                        onClick={() => downloadCompletedReceipt(order)}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          backgroundColor: '#059669',
                          borderColor: '#059669',
                          color: 'white'
                        }}
                      >
                        📋 Completed Receipt
                      </button>
                    )}
                    
                    {/* Show message when no receipts are available */}
                    {order.status !== 'processing' && order.status !== 'in_transit' && order.status !== 'receiving' && order.status !== 'delivered' && (
                      <div style={{ 
                        padding: '8px 12px', 
                        fontSize: '12px', 
                        color: 'var(--muted)',
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        borderRadius: '4px'
                      }}>
                        📋 No receipts available yet - waiting for deposit payment
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
                    {(order.status === 'processing' || order.status === 'in_transit' || order.status === 'receiving' || order.status === 'delivered') && (
                      <div>• <strong>Order Receipt:</strong> Shows deposit payment and remaining balance</div>
                    )}
                    {order.status === 'delivered' && (
                      <div>• <strong>Completed Receipt:</strong> Shows full payment completion and delivery</div>
                    )}
                    {order.status !== 'processing' && order.status !== 'in_transit' && order.status !== 'receiving' && order.status !== 'delivered' && (
                      <div>• Receipts will be available once payments are processed</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 40,
          border: '1px dashed #2a3342',
          borderRadius: 8,
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>No Orders Found</h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            {filter === 'all' ? 'No orders have been submitted yet.' : `No orders in ${getStageInfo(filter).label} stage.`}
          </p>
        </div>
      )}
    </div>
  )
}
