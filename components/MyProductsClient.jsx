'use client'

import { useState, useEffect } from 'react'

export default function MyProductsClient() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [userName, setUserName] = useState('')
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [activeFilter, setActiveFilter] = useState('')
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('')
  const [selectedProductName, setSelectedProductName] = useState('')
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [withdrawalForm, setWithdrawalForm] = useState({ name: '', phone: '' })
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [withdrawalStatuses, setWithdrawalStatuses] = useState({})

  useEffect(() => {
    fetchUserProducts()
  }, [])

  async function fetchUserProducts() {
    try {
      setLoading(true)
      setError('')
      
      // Get current user from session (database-first)
      const currentUser = await getCurrentUser()
      
      if (!currentUser || !currentUser.phone) {
        setError('User not authenticated')
        setLoading(false)
        return
      }
      
      setUserPhone(currentUser.phone)
      
      // Fetch sales from database
      const userSales = await getUserSales(currentUser.phone)
      
      setSales(userSales)
      setLoading(false)
      
    } catch (error) {
      console.error('Error fetching user products:', error)
      setError('Failed to load products')
      setLoading(false)
    }
  }
  
  async function checkWithdrawalStatuses(soldProducts) {
    const statuses = {}
    
    try {
      const statusPromises = soldProducts.map(async (product) => {
        try {
          const response = await fetch(`/api/withdrawal/status?productId=${product._id}`)
          const data = await response.json()
          return { productId: product._id, ...data }
        } catch (error) {
          console.error(`Error checking status for product ${product._id}:`, error)
          return { productId: product._id, hasWithdrawal: false }
        }
      })
      
      const results = await Promise.all(statusPromises)
      
      results.forEach(result => {
        statuses[result.productId] = result
      })
      
      setWithdrawalStatuses(statuses)
    } catch (error) {
      console.error('Error checking withdrawal statuses:', error)
    }
  }

  function getStatusBadge(status, product) {
    // Don't show badge for pending products (both admin and marketplace)
    if (status === 'pending') {
      return null
    }
    
    const styles = {
      pending: { background: '#ffc107', color: '#000' },
      approved: { background: 'transparent', color: '#28a745' },
      rejected: { background: '#dc3545', color: '#fff' },
      sold: { background: 'transparent', color: product?.soldToAdmin ? '#dc3545' : '#6f42c1' }
    }
    
    return (
      <span style={{
        ...styles[status],
        padding: (status === 'sold' || status === 'approved') ? '0' : '4px 8px',
        borderRadius: (status === 'sold' || status === 'approved') ? '0' : '4px',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
      }}>
        {status}
      </span>
    )
  }

  function getSubmissionTypeDisplay(type) {
    return type === 'public' ? '📢 Community Marketplace' : '🔒 Direct to Admin'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p>Loading your products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        background: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #dee2e6'
      }}>
        <p style={{ color: '#6c757d', marginBottom: 16 }}>{error}</p>
        <a 
          href="/sell" 
          style={{
            display: 'inline-block',
            background: '#007bff',
            color: 'white',
            padding: '8px 16px',
            fontSize: 14,
            borderRadius: 6,
            textDecoration: 'none'
          }}
        >
          Submit Your First Product
        </a>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        background: '#f8f9fa',
        borderRadius: 8,
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>No Products Found</h3>
        <p style={{ color: '#6c757d', marginBottom: 16 }}>
          You haven't submitted any products yet.
        </p>
        <a 
          href="/sell" 
          style={{
            display: 'inline-block',
            background: '#007bff',
            color: 'white',
            padding: '8px 16px',
            fontSize: 14,
            borderRadius: 6,
            textDecoration: 'none'
          }}
        >
          Submit Your First Product
        </a>
      </div>
    )
  }

  async function refreshProducts() {
    if (!userPhone) return
    
    setRefreshing(true)
    try {
      await fetchUserProducts(userPhone)
    } finally {
      setRefreshing(false)
    }
  }

  function filterProducts(status) {
    setActiveFilter(status)
    if (status === 'all' || status === '') {
      setFilteredProducts(allProducts)
    } else {
      const filtered = allProducts.filter(product => {
        if (status === 'sold') {
          // Check if product is sold based on the status returned from API
          return product.status === 'sold'
        }
        return product.status === status
      })
      setFilteredProducts(filtered)
    }
  }

  function getFilterCount(status) {
    if (status === 'all') return allProducts.length
    if (status === 'sold') {
      return allProducts.filter(p => p.status === 'sold').length
    }
    return allProducts.filter(p => p.status === status).length
  }

  function openRejectionModal(reason, productName) {
    setSelectedRejectionReason(reason)
    setSelectedProductName(productName)
    setShowRejectionModal(true)
  }

  function closeRejectionModal() {
    setShowRejectionModal(false)
    setSelectedRejectionReason('')
    setSelectedProductName('')
  }

  function navigateToWithdrawal(product) {
    // Navigate to withdrawal page with product ID
    window.location.href = `/withdrawal?product=${product._id}`
  }

  function closeWithdrawalModal() {
    setShowWithdrawalModal(false)
    setSelectedProduct(null)
    setWithdrawalForm({ name: '', phone: '' })
    setWithdrawalLoading(false)
  }

  function calculateWithdrawalAmount(price) {
    const serviceFee = price * 0.15 // 15% service fee
    const withdrawalAmount = price - serviceFee
    return { withdrawalAmount, serviceFee }
  }

  async function handleWithdrawal() {
    if (!withdrawalForm.name.trim() || !withdrawalForm.phone.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (!/^(\+254|0)[17]\d{8}$/.test(withdrawalForm.phone)) {
      alert('Please enter a valid Kenyan phone number')
      return
    }

    setWithdrawalLoading(true)
    
    try {
      const response = await fetch('/api/withdrawal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          productName: selectedProduct.name,
          productPrice: selectedProduct.price,
          sellerName: withdrawalForm.name,
          sellerPhone: withdrawalForm.phone,
          ...calculateWithdrawalAmount(selectedProduct.price)
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert('Withdrawal request submitted successfully! You will receive your payment within 24 hours.')
        closeWithdrawalModal()
        // Refresh products to update status
        if (userPhone) fetchUserProducts(userPhone)
      } else {
        alert(data.error || 'Failed to submit withdrawal request')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setWithdrawalLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* User name in top right corner */}
      <div className="user-name-badge" style={{
        position: 'absolute',
        top: -105,
        right: 0,
        fontSize: 16,
        fontWeight: '600',
        color: 'var(--text)',
        zIndex: 10
      }}>
        👤 {userName || 'User'}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 768px) {
            .user-name-badge {
              top: -80px !important;
            }
          }
        `
      }} />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24, 
        padding: '20px 24px',
        background: 'var(--card)',
        borderRadius: 12,
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        color: 'var(--text)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 14, 
            opacity: 0.9,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ 
              fontSize: 13,
              fontWeight: '500'
            }}>
              📱 {userPhone}
            </span>
          </div>
          <div style={{ 
            fontSize: 13, 
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: '500'
            }}>
              📦 {products.length}
            </span>
            product{products.length !== 1 ? 's' : ''} submitted
          </div>
        </div>
        <button
          onClick={refreshProducts}
          disabled={refreshing}
          style={{
            background: '#007bff',
            color: 'white',
            border: '1px solid #007bff',
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: '500',
            borderRadius: 8,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.7 : 1,
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            minWidth: '100px',
            width: '100px'
          }}
          onMouseOver={(e) => {
            if (!refreshing) {
              e.target.style.background = '#0056b3'
              e.target.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseOut={(e) => {
            if (!refreshing) {
              e.target.style.background = '#007bff'
              e.target.style.transform = 'translateY(0)'
            }
          }}
        >
          {refreshing ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
              Refreshing...
            </>
          ) : (
            <>
              🔄 Refresh
            </>
          )}
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes blink-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          
          .filter-buttons-container {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }
          
          .filter-buttons-container::-webkit-scrollbar {
            display: none; /* WebKit */
          }
        `
      }} />
      
      {/* Filter Buttons */}
      <div className="filter-buttons-container" style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        overflowX: 'auto',
        paddingBottom: 4,
        background: 'transparent'
      }}>
        {[
          { key: 'all', label: 'All', icon: '🔍' },
          { key: 'pending', label: 'Pending', icon: '⏳' },
          { key: 'approved', label: 'Approved', icon: '✅' },
          { key: 'rejected', label: 'Rejected', icon: '❌' },
          { key: 'sold', label: 'Sold', icon: '💰' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => filterProducts(filter.key)}
            style={{
              background: activeFilter === filter.key ? '#007bff' : 'transparent',
              color: activeFilter === filter.key ? 'white' : 'var(--text)',
              border: `1px solid ${activeFilter === filter.key ? '#007bff' : '#e1e8ed'}`,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: '500',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            <span style={{
              background: activeFilter === filter.key ? 'rgba(255,255,255,0.2)' : '#e1e8ed',
              color: activeFilter === filter.key ? 'white' : '#666',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 'bold',
              marginLeft: 2
            }}>
              {getFilterCount(filter.key)}
            </span>
          </button>
        ))}
      </div>
      
      <div style={{ display: 'grid', gap: 16 }}>
        {filteredProducts.map((product, index) => (
          <div 
            key={product._id || index}
            style={{
              border: '1px solid #e1e8ed',
              borderRadius: 12,
              padding: 20,
              background: 'var(--card)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.12)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ marginTop: 0, marginBottom: 4, fontSize: 16, color: 'white' }}>
                  {product.name}
                </h4>
                <p style={{ margin: 0, fontSize: 14, color: 'white' }}>
                  {product.category}
                </p>
                {product.status === 'pending' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#ffc107', fontWeight: 'bold' }}>
                    ⏳ Product is under review
                  </p>
                )}
                {product.status === 'approved' && product.submissionType !== 'direct_to_admin' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#28a745', fontWeight: 'bold' }}>
                    ✅ Product approved • Live on Site
                  </p>
                )}
                {product.status === 'rejected' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#dc3545', fontWeight: 'bold' }}>
                    ❌ Product has been rejected
                  </p>
                )}
                {product.status === 'sold' && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#dc3545', fontWeight: 'bold' }}>
                    {product.soldToAdmin ? '🔴 Sold to Admin' : '💰 Product has been sold'}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {getStatusBadge(product.status, product)}
                {product.status === 'pending' && product.submissionType !== 'direct_to_admin' && (
                  <span style={{ fontSize: 11, color: 'white' }}>Pending Review</span>
                )}
                {product.status === 'approved' && product.submissionType !== 'direct_to_admin' && (
                  <span style={{ fontSize: 11, color: 'white' }}>
                    <span 
                      style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#28a745',
                        borderRadius: '50%',
                        marginRight: '6px',
                        animation: 'blink-dot 1.5s ease-in-out infinite'
                      }}
                    />
                    Live on Site
                  </span>
                )}
                {product.status === 'sold' && !product.soldToAdmin && (
                  <span style={{ fontSize: 11, color: 'white' }}>Sold Out</span>
                )}
                {product.status === 'rejected' && (
                  <span style={{ fontSize: 11, color: 'white' }}>Rejected</span>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'white' }}>
                <strong style={{ color: '#28a745' }}>Submission Type:</strong> {getSubmissionTypeDisplay(product.submissionType)}
              </p>
              {product.description && (
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: 14, 
                  color: 'white',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.4'
                }}>
                  <strong style={{ color: '#28a745' }}>Description:</strong> {product.description}
                </p>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'white' }}>
              <span>
                Submitted: {new Date(product.createdAt).toLocaleDateString()}
              </span>
              {product.status === 'rejected' && product.rejectionReason && (
                <button
                  onClick={() => openRejectionModal(product.rejectionReason, product.name)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#c82333'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#dc3545'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  Click to review
                </button>
              )}
              {product.status === 'sold' && !product.soldToAdmin && (
                <button
                  onClick={() => navigateToWithdrawal(product)}
                  style={{
                    background: withdrawalStatuses[product._id]?.hasWithdrawal ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: '500',
                    cursor: withdrawalStatuses[product._id]?.hasWithdrawal ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: withdrawalStatuses[product._id]?.hasWithdrawal ? 0.7 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!withdrawalStatuses[product._id]?.hasWithdrawal) {
                      e.target.style.background = '#218838'
                      e.target.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!withdrawalStatuses[product._id]?.hasWithdrawal) {
                      e.target.style.background = '#28a745'
                      e.target.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {withdrawalStatuses[product._id]?.hasWithdrawal ? 
                    (withdrawalStatuses[product._id]?.status === 'pending' ? '⏳ Pending payment' :
                     withdrawalStatuses[product._id]?.status === 'processing' ? '🔄 Processing' :
                     withdrawalStatuses[product._id]?.status === 'completed' ? '✅ Completed' : '❌ Failed') :
                    '💳 Withdraw Money'
                  }
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filteredProducts.length === 0 && activeFilter !== 'all' && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--card)',
          borderRadius: 8,
          border: '1px solid #e1e8ed',
          marginBottom: 24
        }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            No {activeFilter} products found.
          </p>
        </div>
      )}
      
      <div style={{ marginTop: 24, textAlign: 'left' }}>
        <a 
          href="/sell" 
          style={{
            display: 'inline-block',
            background: '#28a745',
            color: 'white',
            padding: '10px 20px',
            fontSize: 14,
            borderRadius: 6,
            textDecoration: 'none'
          }}
        >
          Submit Another Product
        </a>
      </div>
      
      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: '1px solid #e1e8ed'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              borderBottom: '1px solid #e1e8ed',
              paddingBottom: 16
            }}>
              <h3 style={{
                margin: 0,
                color: 'var(--text)',
                fontSize: 18,
                fontWeight: '600'
              }}>
                ❌ Product Rejection Details
              </h3>
              <button
                onClick={closeRejectionModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '4px',
                  borderRadius: 4,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.color = 'var(--text)'
                  e.target.style.background = '#f0f0f0'
                }}
                onMouseOut={(e) => {
                  e.target.style.color = 'var(--muted)'
                  e.target.style.background = 'transparent'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--muted)',
                marginBottom: 8
              }}>
                Product Name:
              </p>
              <p style={{
                margin: 0,
                fontSize: 16,
                color: 'var(--text)',
                fontWeight: '600',
                marginBottom: 16
              }}>
                {selectedProductName}
              </p>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--muted)',
                marginBottom: 8
              }}>
                Rejection Reason:
              </p>
              <div style={{
                backgroundColor: 'transparent',
                border: '1px solid #e1e8ed',
                borderRadius: 8,
                padding: '12px 16px',
                color: 'var(--text)',
                fontSize: 14,
                lineHeight: 1.5
              }}>
                {selectedRejectionReason}
              </div>
            </div>
            
            <div style={{
              backgroundColor: 'transparent',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 20
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: 14,
                color: 'var(--text)',
                fontWeight: '600'
              }}>
                💡 What to do next:
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 13,
                color: 'var(--muted)',
                lineHeight: 1.6
              }}>
                <li>Review the rejection reason carefully</li>
                <li>Make necessary improvements to your product</li>
                <li>Submit a new product with the corrections</li>
                <li>Contact admin if you need clarification</li>
              </ul>
            </div>
            
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={closeRejectionModal}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#5a6268'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#6c757d'
                }}
              >
                Close
              </button>
              <a
                href="/sell"
                style={{
                  display: 'inline-block',
                  background: '#28a745',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#218838'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#28a745'
                }}
              >
                Submit New Product
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Withdrawal Modal */}
      {showWithdrawalModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--card)',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: '1px solid #e1e8ed'
          }}>
            <WithdrawalModalContent 
              selectedProduct={selectedProduct}
              withdrawalStatuses={withdrawalStatuses}
              withdrawalForm={withdrawalForm}
              setWithdrawalForm={setWithdrawalForm}
              withdrawalLoading={withdrawalLoading}
              calculateWithdrawalAmount={calculateWithdrawalAmount}
              handleWithdrawal={handleWithdrawal}
              closeWithdrawalModal={closeWithdrawalModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Separate component for withdrawal modal content
function WithdrawalModalContent({ 
  selectedProduct, 
  withdrawalStatuses, 
  withdrawalForm, 
  setWithdrawalForm, 
  withdrawalLoading, 
  calculateWithdrawalAmount, 
  handleWithdrawal, 
  closeWithdrawalModal 
}) {
  const withdrawalStatus = withdrawalStatuses[selectedProduct._id]
  const hasWithdrawal = withdrawalStatus?.hasWithdrawal
  const status = withdrawalStatus?.status

  // Status-based content
  if (hasWithdrawal) {
    return (
      <>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '1px solid #e1e8ed',
          paddingBottom: 16
        }}>
          <h3 style={{
            margin: 0,
            color: 'var(--text)',
            fontSize: 18,
            fontWeight: '600'
          }}>
            {status === 'pending' ? '⏳ Withdrawal Pending' :
             status === 'processing' ? '🔄 Payment Processing' :
             status === 'completed' ? '✅ Payment Completed' : '❌ Withdrawal Failed'}
          </h3>
          <button
            onClick={closeWithdrawalModal}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '4px',
              borderRadius: 4
            }}
          >
            ×
          </button>
        </div>
        
        {/* Withdrawal Request Date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: '500' }}>Withdrawal Requested:</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: '600' }}>
            {new Date(withdrawalStatus.requestDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
        
        {/* Product Info */}
        <div style={{ marginBottom: 20, padding: '16px', backgroundColor: 'var(--surface)', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--text)' }}>
            {selectedProduct.name}
          </h4>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Sale Price: Ksh {Number(selectedProduct.price).toLocaleString('en-KE')}
          </p>
        </div>

        {/* Status Message */}
        <div style={{
          backgroundColor: status === 'completed' ? '#e8f5e8' : status === 'failed' ? '#fef2f2' : '#fff3cd',
          border: `1px solid ${status === 'completed' ? '#28a745' : status === 'failed' ? '#dc3545' : '#ffc107'}`,
          borderRadius: 8,
          padding: '16px',
          marginBottom: 20
        }}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 14, 
            color: status === 'completed' ? '#28a745' : status === 'failed' ? '#dc3545' : '#856404',
            fontWeight: '600' 
          }}>
            {status === 'pending' && '⏳ Pending Payment'}
            {status === 'processing' && '🔄 Payment Processing'}
            {status === 'completed' && '✅ Payment Sent'}
            {status === 'failed' && '❌ Payment Failed'}
          </h4>
          <p style={{ 
            margin: 0, 
            fontSize: 13, 
            color: status === 'completed' ? '#155724' : status === 'failed' ? '#721c24' : '#533f03',
            lineHeight: 1.4 
          }}>
            {status === 'pending' && 'Your withdrawal request is pending admin review. You will be notified once it\'s processed.'}
            {status === 'processing' && 'Your withdrawal is currently being processed. Payment will be sent to your account within 24 hours.'}
            {status === 'completed' && `Your withdrawal has been completed successfully. Payment should have been received in your account (${withdrawalStatus.sellerPhone}).`}
            {status === 'failed' && 'Your withdrawal request failed. Please contact admin for assistance or try submitting a new request.'}
          </p>
        </div>
        
        {/* Payment Details */}
        <div style={{ marginBottom: 20, padding: '16px', backgroundColor: 'var(--surface)', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--text)', fontWeight: '600' }}>
            💰 Payment Breakdown & Details:
          </h4>
          
          {/* Original Sale Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Original Sale Price:</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: '500' }}>
              Ksh {Number(selectedProduct.price).toLocaleString('en-KE')}
            </span>
          </div>
          
          {/* Service Fee Deduction */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Platform Service Fee (15%):</span>
            <span style={{ fontSize: 13, color: '#dc3545', fontWeight: '500' }}>
              - Ksh {Number(withdrawalStatus.serviceFee || calculateWithdrawalAmount(selectedProduct.price).serviceFee).toLocaleString('en-KE')}
            </span>
          </div>
          
          {/* Divider */}
          <hr style={{ border: 'none', borderTop: '1px solid #e1e8ed', margin: '12px 0' }} />
          
          {/* Final Amount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: '600' }}>Amount Sent to Account:</span>
            <span style={{ fontSize: 14, color: '#28a745', fontWeight: '700' }}>
              Ksh {Number(withdrawalStatus.withdrawalAmount || calculateWithdrawalAmount(selectedProduct.price).withdrawalAmount).toLocaleString('en-KE')}
            </span>
          </div>
        </div>
        
      </>
    )
  }

  // Original withdrawal form for new requests
  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1px solid #e1e8ed',
        paddingBottom: 16
      }}>
        <h3 style={{
          margin: 0,
          color: 'var(--text)',
          fontSize: 18,
          fontWeight: '600'
        }}>
          💳 Withdraw Your Money
        </h3>
        <button
          onClick={closeWithdrawalModal}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: 'var(--muted)',
            padding: '4px',
            borderRadius: 4,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.color = 'var(--text)'
            e.target.style.background = '#f0f0f0'
          }}
          onMouseOut={(e) => {
            e.target.style.color = 'var(--muted)'
            e.target.style.background = 'transparent'
          }}
        >
          ×
        </button>
      </div>
      
      {/* Product Info */}
      <div style={{ marginBottom: 20, padding: '16px', backgroundColor: 'var(--surface)', borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: 'var(--text)' }}>
          {selectedProduct.name}
        </h4>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
          Sale Price: Ksh {Number(selectedProduct.price).toLocaleString('en-KE')}
        </p>
      </div>
      
      {/* Payment Breakdown */}
      <div style={{ marginBottom: 20, padding: '16px', backgroundColor: 'var(--surface)', borderRadius: 8 }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--text)', fontWeight: '600' }}>
          💰 Payment Breakdown:
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Sale Amount:</span>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>Ksh {Number(selectedProduct.price).toLocaleString('en-KE')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Service Fee (15%):</span>
          <span style={{ fontSize: 13, color: '#dc3545' }}>- Ksh {Number(calculateWithdrawalAmount(selectedProduct.price).serviceFee).toLocaleString('en-KE')}</span>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #e1e8ed', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: '600' }}>You'll Receive:</span>
          <span style={{ fontSize: 14, color: '#28a745', fontWeight: '600' }}>Ksh {Number(calculateWithdrawalAmount(selectedProduct.price).withdrawalAmount).toLocaleString('en-KE')}</span>
        </div>
      </div>
      
      {/* Form Fields */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text)', fontWeight: '500' }}>
          Full Name *
        </label>
        <input
          type="text"
          value={withdrawalForm.name}
          onChange={(e) => setWithdrawalForm({...withdrawalForm, name: e.target.value})}
          placeholder="Enter your full name"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e1e8ed',
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            boxSizing: 'border-box'
          }}
        />
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--text)', fontWeight: '500' }}>
          Phone Number *
        </label>
        <input
          type="tel"
          value={withdrawalForm.phone}
          onChange={(e) => setWithdrawalForm({...withdrawalForm, phone: e.target.value})}
          placeholder="0712345678 or +254712345678"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e1e8ed',
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            boxSizing: 'border-box'
          }}
        />
      </div>
      
      {/* Important Notice */}
      <div style={{
        backgroundColor: '#e8f5e8',
        border: '1px solid #28a745',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 20
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: '#28a745', fontWeight: '600' }}>
          ⏰ Important Notice:
        </h4>
        <p style={{ margin: 0, fontSize: 12, color: '#155724', lineHeight: 1.4 }}>
          All money will be sent to your account within 24 hours after processing your withdrawal request.
        </p>
      </div>
      
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={closeWithdrawalModal}
          disabled={withdrawalLoading}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: '500',
            cursor: withdrawalLoading ? 'not-allowed' : 'pointer',
            opacity: withdrawalLoading ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleWithdrawal}
          disabled={withdrawalLoading || !withdrawalForm.name.trim() || !withdrawalForm.phone.trim()}
          style={{
            background: withdrawalLoading || !withdrawalForm.name.trim() || !withdrawalForm.phone.trim() ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: '500',
            cursor: withdrawalLoading || !withdrawalForm.name.trim() || !withdrawalForm.phone.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          {withdrawalLoading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
              Processing...
            </>
          ) : (
            <>
              💳 Request Withdrawal
            </>
          )}
        </button>
      </div>
    </>
  )
}
