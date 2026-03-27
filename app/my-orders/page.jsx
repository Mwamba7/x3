'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'
import { useAuth } from '../../components/AuthContext'

export default function MyOrdersPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
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
  const [loadingOrders, setLoadingOrders] = useState(new Set())
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  
  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchUserOrders = useCallback(async () => {
    try {
      console.log('🔍 Fetching user orders...')
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/orders')
      console.log('📡 Response status:', response.status)
      
      const result = await response.json()
      console.log('📋 Orders result:', result)
      
      if (result.success) {
        console.log('✅ Orders found:', result.orders?.length || 0)
        setOrders(result.orders || [])
      } else {
        console.log('❌ No orders or error:', result.error)
        setError(result.error || 'No orders found for your account')
        setOrders([])
      }
    } catch (err) {
      console.error('💥 Error fetching orders:', err)
      setError('Failed to fetch orders. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log('🔄 useEffect triggered - isAuthenticated:', isAuthenticated, 'user:', user?.name)
    // Check if user is authenticated and fetch their orders
    if (isAuthenticated && user) {
      console.log('👤 User authenticated, fetching orders...')
      fetchUserOrders()
    } else if (!isAuthenticated) {
      console.log('🚫 User not authenticated, stopping loading')
      setLoading(false)
    }
  }, [isAuthenticated, user, fetchUserOrders])


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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📦 My Orders</h1>
      </div>


      {/* Welcome Section */}
      {isAuthenticated && user && (
        <div style={{ 
          border: '1px solid #253049', 
          borderRadius: 8, 
          padding: 20, 
          backgroundColor: 'var(--card)', 
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--primary)' }}>
            👋 Welcome, {user.name}!
          </h2>
        </div>
      )}

      {/* Refresh Section */}
      {orders.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
              Your Orders: <strong style={{ color: 'var(--text)' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} found</strong>
            </p>
            <button
              onClick={() => {
                fetchUserOrders()
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #2a3342',
                borderRadius: 4,
                color: 'var(--muted)',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          padding: 20, 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: 8, 
          color: '#721c24', 
          marginBottom: 20 
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {isAuthenticated && loading && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
          <p>Loading your orders...</p>
        </div>
      )}

      {/* Orders List */}
      {isAuthenticated && orders.length > 0 && (
        <>
          {/* Success message */}
          <div style={{
            padding: 12,
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: 6,
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#065f46' }}>
              ✅ Found <strong>{orders.length}</strong> order{orders.length > 1 ? 's' : ''} in your account. 
              Click on any order to view detailed information and track delivery status.
            </p>
          </div>
          
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

              {/* Order Items Preview */}
              <div style={{ 
                marginTop: windowWidth <= 768 ? 8 : 12,
                padding: windowWidth <= 768 ? '8px' : '12px',
                backgroundColor: 'rgba(42, 51, 66, 0.05)',
                borderRadius: windowWidth <= 768 ? 4 : 6,
                border: '1px solid rgba(42, 51, 66, 0.1)'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px', 
                  fontSize: windowWidth <= 768 ? 11 : 12, 
                  fontWeight: 600, 
                  color: 'var(--primary)' 
                }}>
                  📦 Order Items ({order.items?.length || 0})
                </h4>
                
                {order.items && order.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: windowWidth <= 768 ? 6 : 8 }}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: windowWidth <= 768 ? 8 : 10,
                        padding: windowWidth <= 768 ? '4px' : '6px',
                        backgroundColor: 'var(--surface)',
                        borderRadius: windowWidth <= 768 ? 3 : 4,
                        border: '1px solid rgba(42, 51, 66, 0.1)'
                      }}>
                        {/* Product Image */}
                        {item.img && (
                          <div style={{ 
                            width: windowWidth <= 768 ? 32 : 40, 
                            height: windowWidth <= 768 ? 32 : 40, 
                            borderRadius: windowWidth <= 768 ? 3 : 4, 
                            overflow: 'hidden',
                            backgroundColor: '#f3f4f6',
                            flexShrink: 0
                          }}>
                            <img 
                              src={item.img} 
                              alt={item.name}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'none', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: windowWidth <= 768 ? 12 : 14,
                              color: '#9ca3af'
                            }}>📦</div>
                          </div>
                        )}
                        
                        {/* Item Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            fontSize: windowWidth <= 768 ? 10 : 11, 
                            fontWeight: 600, 
                            color: 'var(--text)',
                            marginBottom: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.name}
                          </div>
                          <div style={{ 
                            fontSize: windowWidth <= 768 ? 9 : 10, 
                            color: 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: windowWidth <= 768 ? 4 : 6
                          }}>
                            <span>Qty: {item.quantity}</span>
                            <span>•</span>
                            <span>Ksh {Number(item.price).toLocaleString('en-KE')}</span>
                            {item.condition && (
                              <>
                                <span>•</span>
                                <span style={{ 
                                  textTransform: 'capitalize',
                                  color: item.condition === 'new' ? '#22c55e' : 
                                        item.condition === 'excellent' ? '#3b82f6' : 
                                        item.condition === 'good' ? '#f59e0b' : '#6b7280'
                                }}>
                                  {item.condition}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Item Total */}
                        <div style={{ 
                          fontSize: windowWidth <= 768 ? 10 : 11, 
                          fontWeight: 600, 
                          color: 'var(--primary)',
                          textAlign: 'right',
                          flexShrink: 0
                        }}>
                          Ksh {Number(item.lineTotal || (item.price * item.quantity)).toLocaleString('en-KE')}
                        </div>
                      </div>
                    ))}
                    
                    {/* Show more items indicator */}
                    {order.items.length > 3 && (
                      <div style={{ 
                        fontSize: windowWidth <= 768 ? 9 : 10, 
                        color: 'var(--muted)', 
                        textAlign: 'center',
                        fontStyle: 'italic',
                        padding: windowWidth <= 768 ? '2px' : '4px'
                      }}>
                        +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: windowWidth <= 768 ? 10 : 11, 
                    color: 'var(--muted)', 
                    textAlign: 'center',
                    padding: windowWidth <= 768 ? '8px' : '12px'
                  }}>
                    No items found
                  </div>
                )}
                
                {/* Order Summary */}
                <div style={{ 
                  marginTop: windowWidth <= 768 ? 8 : 12,
                  paddingTop: windowWidth <= 768 ? 8 : 12,
                  borderTop: '1px solid rgba(42, 51, 66, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontSize: windowWidth <= 768 ? 10 : 11, 
                    color: 'var(--muted)' 
                  }}>
                    {order.delivery?.method === 'delivery' ? '🚚 Home Delivery' : '🏪 Store Pickup'}
                    {order.payment?.depositPaid && (
                      <span style={{ 
                        marginLeft: windowWidth <= 768 ? 6 : 8,
                        color: '#22c55e',
                        fontWeight: 600
                      }}>
                        • Deposit Ksh {Number(order.payment?.depositAmount || 0).toLocaleString('en-KE')} ✓
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: windowWidth <= 768 ? 11 : 12, 
                    fontWeight: 600, 
                    color: 'var(--primary)' 
                  }}>
                    Remaining: Ksh {Number(order.payment?.remainingAmount || order.totalAmount).toLocaleString('en-KE')}
                  </div>
                </div>
              </div>

            </div>
          ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {isAuthenticated && !loading && orders.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          border: '1px dashed #2a3342',
          borderRadius: 8,
          color: 'var(--muted)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600 }}>No Orders Yet</h3>
          <p style={{ margin: '0 0 20px', fontSize: 14 }}>
            You haven't placed any orders yet. Start shopping to see your orders here!
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
