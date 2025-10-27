'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'

export default function MyOrdersPage() {
  // Add CSS for loading animation and responsive styles
  const spinKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
  
  // Responsive styles - compact on mobile, normal on larger screens
  const getContainerStyles = () => ({
    border: '1px solid #253049',
    borderRadius: windowWidth <= 768 ? 4 : 8,
    padding: windowWidth <= 768 ? 8 : 16,
    backgroundColor: 'var(--card)'
  })
  
  const getHeaderStyles = (orderId) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: windowWidth <= 768 ? 4 : 12,
    cursor: 'pointer',
    padding: windowWidth <= 768 ? '4px' : '8px',
    borderRadius: windowWidth <= 768 ? 2 : 4,
    transition: 'background-color 0.2s',
    backgroundColor: loadingOrders.has(orderId) ? 'rgba(42, 51, 66, 0.1)' : 'transparent'
  })
  
  const getOrderTitleStyles = () => ({
    margin: windowWidth <= 768 ? '0 0 1px' : '0 0 2px',
    fontSize: windowWidth <= 768 ? 12 : 13,
    fontWeight: 600
  })
  
  const getDateStyles = () => ({
    margin: 0,
    fontSize: windowWidth <= 768 ? 10 : 11,
    color: 'var(--muted)'
  })
  
  const getStatusBadgeStyles = (status) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: windowWidth <= 768 ? 3 : 4,
    padding: windowWidth <= 768 ? '3px 8px' : '4px 10px',
    backgroundColor: getStatusColor(status),
    color: 'white',
    borderRadius: windowWidth <= 768 ? 2 : 3,
    fontSize: windowWidth <= 768 ? 9 : 10,
    fontWeight: 600,
    minHeight: windowWidth <= 768 ? 18 : 20,
    minWidth: windowWidth <= 768 ? 80 : 100,
    textAlign: 'center',
    whiteSpace: 'nowrap'
  })
  
  const getListGap = () => windowWidth <= 768 ? 10 : 16
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showSearch, setShowSearch] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(new Set())
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const router = useRouter()
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchOrders = async (phone) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/orders/search?phone=${encodeURIComponent(phone)}`)
      const result = await response.json()
      
      if (result.success) {
        setOrders(result.orders)
        setShowSearch(false)
        localStorage.setItem('customerPhone', phone) // Remember for next visit
      } else {
        setError(result.error || 'No orders found for this phone number')
        setOrders([])
      }
    } catch (err) {
      setError('Failed to fetch orders. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if phone number is saved from previous visit
    const savedPhone = localStorage.getItem('customerPhone')
    if (savedPhone) {
      setPhoneNumber(savedPhone)
      fetchOrders(savedPhone)
    } else {
      setLoading(false)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (phoneNumber.trim()) {
      fetchOrders(phoneNumber.trim())
    }
  }

  const handleOrderClick = async (orderId) => {
    // Show loading state
    const newLoading = new Set(loadingOrders)
    newLoading.add(orderId)
    setLoadingOrders(newLoading)

    setTimeout(() => {
      router.push(`/my-orders/${orderId}`)
    }, 800) // 800ms loading simulation
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📦 My Orders</h1>
        <Link href="/" className="btn" style={{ padding: '8px 12px', fontSize: '13px' }}>
          Back to Home
        </Link>
      </div>

      {/* Search Section */}
      {showSearch && (
        <div style={{ 
          border: '1px solid #253049', 
          borderRadius: 8, 
          padding: 20, 
          backgroundColor: 'var(--card)', 
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--primary)' }}>
            🔍 Find Your Orders
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
            Enter the phone number you used when placing your orders to view your purchase history.
          </p>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 400, margin: '0 auto' }}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number (e.g., 0712345678)"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #2a3342',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '14px'
              }}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '10px 20px', fontSize: '14px', whiteSpace: 'nowrap' }}
            >
              {loading ? 'Searching...' : 'Find Orders'}
            </button>
          </form>
        </div>
      )}

      {/* Results Section */}
      {!showSearch && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
              Orders for: <strong style={{ color: 'var(--text)' }}>{phoneNumber}</strong>
            </p>
            <button
              onClick={() => {
                setShowSearch(true)
                setOrders([])
                setError(null)
              }}
              className="btn"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Search Different Number
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: 16,
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: 6,
          color: '#721c24',
          marginBottom: 20,
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !showSearch && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
          <p>Loading your orders...</p>
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: getListGap() }}>
          {orders.map((order) => (
            <div
              key={order._id}
              style={getContainerStyles()}
            >
              {/* Order Header - Clickable */}
              <div 
                onClick={() => handleOrderClick(order.orderId)}
                style={getHeaderStyles(order.orderId)}
              >
                <div>
                  <h3 style={getOrderTitleStyles()}>
                    Order #{order.orderId}
                  </h3>
                  <p style={getDateStyles()}>
                    Placed on {formatDate(order.orderDate)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: windowWidth <= 768 ? 6 : 8 }}>
                  <div style={getStatusBadgeStyles(order.status)}>
                    {getStatusIcon(order.status)} {order.status.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', minWidth: 16, textAlign: 'center' }}>
                    {loadingOrders.has(order.orderId) && (
                      <span style={{ 
                        display: 'inline-block',
                        animation: 'spin 1s linear infinite',
                        fontSize: 12
                      }}>⏳</span>
                    )}
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !showSearch && orders.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          border: '1px dashed #2a3342',
          borderRadius: 8,
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>No Orders Found</h3>
          <p style={{ margin: '0 0 20px', fontSize: 14 }}>
            No orders found for this phone number.
          </p>
          <Link href="/#collection" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
    </>
  )
}
