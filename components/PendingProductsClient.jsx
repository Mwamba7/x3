'use client'

import { useState } from 'react'

export default function PendingProductsClient({ products: initialProducts }) {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState({})
  const [showRejectModal, setShowRejectModal] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async (productId) => {
    setLoading(prev => ({ ...prev, [productId]: 'approving' }))
    
    try {
      const response = await fetch('/api/admin/pending/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      const result = await response.json()

      if (response.ok) {
        // Update product status instead of removing
        setProducts(prev => prev.map(p => 
          p._id === productId 
            ? { ...p, status: 'approved', reviewedAt: new Date().toISOString() }
            : p
        ))
        alert('✅ Product approved and published successfully!')
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Approval error:', error)
      alert('❌ Network error. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, [productId]: null }))
    }
  }

  const handleReject = async (productId) => {
    setLoading(prev => ({ ...prev, [productId]: 'rejecting' }))
    
    try {
      const response = await fetch('/api/admin/pending/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          reason: rejectionReason.trim() || 'No reason provided' 
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Update product status instead of removing
        setProducts(prev => prev.map(p => 
          p._id === productId 
            ? { ...p, status: 'rejected', reviewedAt: new Date().toISOString(), rejectionReason: rejectionReason.trim() || 'No reason provided' }
            : p
        ))
        setShowRejectModal(null)
        setRejectionReason('')
        alert('❌ Product rejected and seller notified.')
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Rejection error:', error)
      alert('❌ Network error. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, [productId]: null }))
    }
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to permanently delete this product submission?')) {
      return
    }

    setLoading(prev => ({ ...prev, [productId]: 'deleting' }))
    
    try {
      const response = await fetch('/api/admin/pending/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })

      const result = await response.json()

      if (response.ok) {
        // Remove from list
        setProducts(prev => prev.filter(p => p._id !== productId))
        alert('🗑️ Product submission deleted successfully.')
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('❌ Network error. Please try again.')
    } finally {
      setLoading(prev => ({ ...prev, [productId]: null }))
    }
  }

  const handleWhatsAppNotify = (product) => {
    const message = [
      `📱 Product Review: ${product.name}`,
      `💰 Price: ${product.price ? `Ksh ${product.price}` : 'Not specified'}`,
      `👤 Seller: ${product.sellerName}`,
      `📞 Contact: ${product.sellerPhone}`,
      `📂 Category: ${product.category}`,
      `📝 Description: ${product.description || 'No description'}`,
      '',
      'Please review this product submission.'
    ].join('\n')

    const whatsappUrl = `https://wa.me/254718176584?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
        {products.map(product => (
          <div key={product._id} className="product-card" style={{ border: '1px solid #253049', borderRadius: 12, overflow: 'hidden' }}>
            {/* Product Images */}
            {product.images && product.images.length > 0 && (
              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {product.images.length > 1 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    background: 'rgba(0,0,0,0.7)', 
                    color: 'white', 
                    padding: '4px 8px', 
                    borderRadius: 4, 
                    fontSize: 12 
                  }}>
                    +{product.images.length - 1} more
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: 16 }}>
              {/* Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ 
                  background: 
                    product.status === 'pending' ? '#f39c12' :
                    product.status === 'approved' ? '#27ae60' : '#e74c3c',
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {product.status === 'pending' ? '⏳ PENDING' :
                   product.status === 'approved' ? '✅ APPROVED' : '❌ REJECTED'}
                </span>
                <span style={{ 
                  background: product.submissionType === 'direct_to_admin' ? '#f2994a' : '#27ae60', 
                  color: 'white', 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  fontSize: 11 
                }}>
                  {product.submissionType === 'direct_to_admin' ? '→ Pre-owned' : '→ Community'}
                </span>
              </div>

              {/* Product Info */}
              <div style={{ marginBottom: 12 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: 16 }}>{product.name}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                    {product.price ? `Ksh ${product.price.toLocaleString()}` : 'Price not set'}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize' }}>
                  {product.category}
                </p>
                {product.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: 13, lineHeight: 1.4 }}>
                    {product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                )}
              </div>

              {/* Seller Info */}
              <div style={{ 
                background: 'var(--background-secondary)', 
                padding: 12, 
                borderRadius: 8, 
                marginBottom: 12,
                fontSize: 13
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Seller Details:</div>
                <div>👤 {product.sellerName}</div>
                <div>📞 {product.sellerPhone}</div>
                {product.sellerEmail && <div>📧 {product.sellerEmail}</div>}
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                  <div>📅 Submitted: {formatDate(product.createdAt)}</div>
                  {product.reviewedAt && (
                    <div>🔍 Reviewed: {formatDate(product.reviewedAt)}</div>
                  )}
                  {product.rejectionReason && (
                    <div style={{ color: '#e74c3c', marginTop: 4 }}>
                      💬 Reason: {product.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.status === 'pending' ? (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApprove(product._id)}
                      disabled={loading[product._id]}
                      style={{ 
                        flex: 1, 
                        minWidth: 'auto',
                        opacity: loading[product._id] ? 0.7 : 1 
                      }}
                    >
                      {loading[product._id] === 'approving' ? 'Approving...' : '✅ Approve'}
                    </button>
                    
                    <button
                      className="btn"
                      onClick={() => setShowRejectModal(product._id)}
                      disabled={loading[product._id]}
                      style={{ 
                        flex: 1, 
                        minWidth: 'auto',
                        background: '#e74c3c',
                        color: 'white',
                        opacity: loading[product._id] ? 0.7 : 1 
                      }}
                    >
                      {loading[product._id] === 'rejecting' ? 'Rejecting...' : '❌ Reject'}
                    </button>
                  </>
                ) : (
                  <>
                    {product.status === 'approved' && product.submissionType !== 'direct_to_admin' && (
                      <div style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '8px', 
                        background: 'var(--background-secondary)', 
                        borderRadius: 4,
                        fontSize: 12,
                        color: 'var(--muted)'
                      }}>
                        ✅ Product approved • Live on Site
                      </div>
                    )}
                    {product.status === 'rejected' && (
                      <div style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '8px', 
                        background: 'var(--background-secondary)', 
                        borderRadius: 4,
                        fontSize: 12,
                        color: 'var(--muted)'
                      }}>
                        ❌ Product was rejected
                      </div>
                    )}
                  </>
                )}
                
                <button
                  className="btn"
                  onClick={() => handleWhatsAppNotify(product)}
                  style={{ 
                    background: '#25d366',
                    color: 'white',
                    padding: '8px 12px'
                  }}
                >
                  📞 WhatsApp
                </button>

                <button
                  className="btn"
                  onClick={() => handleDelete(product._id)}
                  disabled={loading[product._id]}
                  style={{ 
                    background: '#6c757d',
                    color: 'white',
                    padding: '8px 12px',
                    opacity: loading[product._id] ? 0.7 : 1 
                  }}
                >
                  {loading[product._id] === 'deleting' ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--background)',
            padding: 24,
            borderRadius: 12,
            maxWidth: 400,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>Reject Product</h3>
            <p>Please provide a reason for rejection (optional):</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Poor image quality, incomplete information, etc."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 8,
                border: '1px solid #253049',
                borderRadius: 4,
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectionReason('')
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => handleReject(showRejectModal)}
                disabled={loading[showRejectModal]}
                style={{ 
                  flex: 1,
                  background: '#e74c3c',
                  color: 'white'
                }}
              >
                {loading[showRejectModal] === 'rejecting' ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
