'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/userSession'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function WithdrawalClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userPhone, setUserPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [allProducts, setAllProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [withdrawalForm, setWithdrawalForm] = useState({ name: '', phone: '' })
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [withdrawalStatuses, setWithdrawalStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get user from session (database-first)
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        
        if (currentUser && currentUser.phone) {
          setUserPhone(currentUser.phone)
          setUserName(currentUser.name || '')
          fetchUserProducts(currentUser.phone)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    
    fetchUser()
  }, [])

  useEffect(() => {
    // Check for product parameter in URL
    const productId = searchParams.get('product')
    if (productId && allProducts.length > 0) {
      const product = allProducts.find(p => p._id === productId)
      if (product) {
        setSelectedProduct(product)
        // Pre-fill with user data from session
        const fetchUserData = async () => {
          const currentUser = await getCurrentUser()
          setWithdrawalForm({
            name: currentUser.name || '',
            phone: currentUser.phone || '',
            productName: product.name,
            productId: product._id,
            saleAmount: product.soldPrice || product.price || 0
          })
        }
        fetchUserData()
      }
    }
  }, [searchParams, allProducts])

  async function fetchUserProducts(phone) {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`/api/my-products?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()
      
      if (response.ok) {
        const products = data.products || []
        setAllProducts(products)
        
        // Fetch withdrawal statuses for these products
        await fetchWithdrawalStatuses(products)
      } else {
        setError(data.error || 'Failed to fetch products')
      }
    } catch (err) {
      setError('Failed to fetch products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchWithdrawalStatuses(products) {
    try {
      const productIds = products.map(p => p._id)
      const response = await fetch('/api/withdrawal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds })
      })
      
      const data = await response.json()
      if (data.success) {
        setWithdrawalStatuses(data.statuses || {})
      }
    } catch (err) {
      console.error('Error fetching withdrawal statuses:', err)
    }
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
          name: withdrawalForm.name,
          phone: withdrawalForm.phone,
          originalPrice: selectedProduct.price
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Withdrawal request submitted successfully!')
        
        // Update withdrawal status
        setWithdrawalStatuses(prev => ({
          ...prev,
          [selectedProduct._id]: {
            hasWithdrawal: true,
            status: 'pending',
            withdrawalAmount: calculateWithdrawalAmount(selectedProduct.price).withdrawalAmount
          }
        }))
        
        // Reset form
        setWithdrawalForm({ name: '', phone: '' })
        setSelectedProduct(null)
        
        // Redirect to my-sales page
        router.push('/my-sales')
      } else {
        alert(data.error || 'Failed to submit withdrawal request')
      }
    } catch (err) {
      alert('Failed to submit withdrawal request. Please try again.')
    } finally {
      setWithdrawalLoading(false)
    }
  }

  function selectProduct(product) {
    setSelectedProduct(product)
    
    // Pre-fill with user data from session
    const fetchUserData = async () => {
      const currentUser = await getCurrentUser()
      setWithdrawalForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        productName: product.name,
        productId: product._id,
        saleAmount: product.soldPrice || product.price || 0
      })
    }
    fetchUserData()
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '40px',
        color: 'var(--muted)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <p>Loading your products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#dc3545', 
        color: 'white', 
        borderRadius: '4px', 
        marginBottom: '16px' 
      }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  if (allProducts.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        color: 'var(--muted)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '600' }}>No Products Available</h3>
        <p style={{ margin: '0 0 20px', fontSize: '14px' }}>
          You don't have any sold products available for withdrawal.
        </p>
        <Link href="/my-products" className="btn btn-primary">
          View My Products
        </Link>
      </div>
    )
  }

  // Filter products that are sold and available for withdrawal
  const availableProducts = allProducts.filter(product => {
    const withdrawalStatus = withdrawalStatuses[product._id]
    return product.soldToAdmin && !withdrawalStatus?.hasWithdrawal
  })

  if (!selectedProduct) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <Link href="/my-products" className="btn" style={{ fontSize: '14px' }}>
            ← Back to My Products
          </Link>
        </div>
        
        <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '600' }}>
          Select Product to Withdraw
        </h3>
        
        {availableProducts.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: 'var(--muted)',
            border: '1px dashed #2a3342',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
            <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>
              No Products Available for Withdrawal
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              You don't have any sold products pending withdrawal.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {availableProducts.map(product => {
              const { withdrawalAmount, serviceFee } = calculateWithdrawalAmount(product.price)
              
              return (
                <div
                  key={product._id}
                  onClick={() => selectProduct(product)}
                  style={{
                    border: '1px solid #2a3342',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'var(--card)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = 'var(--primary)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = '#2a3342'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>
                        {product.name}
                      </h4>
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--muted)' }}>
                        {product.condition} • Sold for Ksh {product.price.toLocaleString('en-KE')}
                      </p>
                      <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                        <div>You'll Receive: <strong style={{ color: '#28a745' }}>Ksh {withdrawalAmount.toLocaleString('en-KE')}</strong></div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Service Fee (15%): -Ksh {serviceFee.toLocaleString('en-KE')}</div>
                      </div>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Select →
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Show withdrawal form for selected product
  const withdrawalStatus = withdrawalStatuses[selectedProduct._id]
  const hasWithdrawal = withdrawalStatus?.hasWithdrawal
  const status = withdrawalStatus?.status
  const { withdrawalAmount, serviceFee } = calculateWithdrawalAmount(selectedProduct.price)

  return (
    <div>
      <div>
        {/* Status-based content */}
        {hasWithdrawal ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {status === 'pending' ? '⏳' :
               status === 'processing' ? '🔄' :
               status === 'completed' ? '✅' : '❌'}
            </div>
            <h3 style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              {status === 'pending' ? 'Withdrawal Pending' :
               status === 'processing' ? 'Payment Processing' :
               status === 'completed' ? 'Payment Completed' : 'Withdrawal Failed'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--muted)' }}>
              {status === 'pending' ? 'Your withdrawal request is being processed.' :
               status === 'processing' ? 'Payment is being processed and will be sent soon.' :
               status === 'completed' ? 'Payment has been sent to your account.' : 'There was an issue with your withdrawal.'}
            </p>
            <Link href="/my-sales" className="btn btn-primary">
              View Status in My Sales
            </Link>
          </div>
        ) : (
          <div>
            {/* Product Info */}
            <div style={{
              backgroundColor: 'rgba(42, 51, 66, 0.1)',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                {selectedProduct.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Sale Price: Ksh {selectedProduct.price.toLocaleString('en-KE')}
              </div>
            </div>

            {/* Payment Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600' }}>
                💰 Payment Breakdown:
              </h4>
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Sale Amount:</span>
                  <span>Ksh {selectedProduct.price.toLocaleString('en-KE')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Service Fee (15%):</span>
                  <span style={{ color: '#dc3545' }}>-Ksh {serviceFee.toLocaleString('en-KE')}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: '600',
                  paddingTop: '8px',
                  borderTop: '1px solid #2a3342'
                }}>
                  <span>You'll Receive:</span>
                  <span style={{ color: '#28a745' }}>Ksh {withdrawalAmount.toLocaleString('en-KE')}</span>
                </div>
              </div>
            </div>

            {/* Form - Horizontal line with input */}
            <div style={{ marginBottom: '20px', maxWidth: '450px', textAlign: 'left' }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="withdrawal-name" style={{ fontSize: '15px', color: '#28a745' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="withdrawal-name"
                    type="text"
                    className="form-control"
                    style={{ 
                      width: '100%', 
                      border: 'none', 
                      borderBottom: '2px solid #2a3342',
                      borderRadius: '0',
                      backgroundColor: 'transparent',
                      padding: '4px 0',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                    value={withdrawalForm.name}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" htmlFor="withdrawal-phone" style={{ fontSize: '15px', color: '#28a745' }}>
                  Phone Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="withdrawal-phone"
                    type="tel"
                    className="form-control"
                    style={{ 
                      width: '100%', 
                      border: 'none', 
                      borderBottom: '2px solid #2a3342',
                      borderRadius: '0',
                      backgroundColor: 'transparent',
                      padding: '4px 0',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                    value={withdrawalForm.phone}
                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="2547XXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Notice */}
            <div style={{
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid #ffc107',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'white' }}>
                ⏰ Important Notice:
              </div>
              <div style={{ fontSize: '11px', color: 'white', lineHeight: '1.4' }}>
                All money will be sent to your account within 24 hours after processing your withdrawal request.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1px solid #2a3342',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawal}
                disabled={withdrawalLoading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: withdrawalLoading ? '#6c757d' : '#28a745',
                  color: 'white',
                  cursor: withdrawalLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
                }}
              >
                {withdrawalLoading ? 'Processing...' : '💳 Request Withdrawal'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
