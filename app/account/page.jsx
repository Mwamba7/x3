'use client'

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthContext'
import WithdrawalStatusBadge from '../../components/WithdrawalStatusBadge'
import jsPDF from 'jspdf'
import Link from 'next/link'

export default function AccountPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAccountManagement, setShowAccountManagement] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [withdrawalStep, setWithdrawalStep] = useState(1) // 1: Details, 2: Payment Method
  const [withdrawalPhone, setWithdrawalPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [showAdminNotificationModal, setShowAdminNotificationModal] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')
  const [mounted, setMounted] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [withdrawalReceipt, setWithdrawalReceipt] = useState(null)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showSalesModal, setShowSalesModal] = useState(false)
  const [showRecentModal, setShowRecentModal] = useState(false)
  
  // Account management states
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    town: '',
    region: '',
    additionalInstructions: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: ''
  })
  const [addressData, setAddressData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    additionalInstructions: ''
  })
  const [originalAddressData, setOriginalAddressData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    region: '',
    additionalInstructions: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [addressErrors, setAddressErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [profileLoading, setProfileLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const { user, isAuthenticated, logout, checkAuthStatus } = useAuth()
  const router = useRouter()
  
  // Handle mounting to prevent SSR issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // PDF Generation Function
  const generateWithdrawalReceipt = async (withdrawalData) => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default
      
      const doc = new jsPDF()
      
      // Set font to match checkout receipt
      doc.setFont('courier', 'normal')
      
      // Header with website title (matching checkout receipt)
      doc.setFontSize(18)
      doc.text('SUPER TWICE RESELLERS', 105, 15, { align: 'center' })
      doc.setFontSize(16)
      doc.text('WITHDRAWAL RECEIPT', 105, 25, { align: 'center' })
      doc.setFontSize(12)
      doc.text(`Receipt ID: WR-${withdrawalData.id.slice(-8).toUpperCase()}`, 105, 35, { align: 'center' })
      
      // Seller name
      if (user?.name) {
        doc.setFontSize(10)
        doc.text(`Seller: ${user.name}`, 20, 45)
      }
      
      // Line separator (matching checkout receipt)
      doc.line(20, 50, 190, 50)
      
      let yPosition = 60
      
      // Product Details Section (matching checkout receipt structure)
      doc.setFontSize(14)
      doc.text('PRODUCT DETAILS:', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.text(`Product: ${withdrawalData.productName}`, 25, yPosition)
      yPosition += 5
      doc.text(`Sale Price: Ksh ${Number(withdrawalData.salePrice).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 10
      
      // Payment Summary Section (matching checkout receipt structure)
      doc.setFontSize(14)
      doc.text('PAYMENT SUMMARY:', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.text(`Sale Amount: Ksh ${Number(withdrawalData.salePrice).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 5
      doc.text(`Service Fee (15%): Ksh ${Number(withdrawalData.serviceFee).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 5
      
      doc.setFontSize(12)
      doc.text(`Withdrawal Amount: Ksh ${Number(withdrawalData.withdrawalAmount).toLocaleString('en-KE')}`, 25, yPosition)
      yPosition += 10
      
      // Seller Information Section
      doc.setFontSize(14)
      doc.text('SELLER INFORMATION:', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(10)
      doc.text(`Name: ${user?.name || 'N/A'}`, 25, yPosition)
      yPosition += 5
      doc.text(`Phone: ${withdrawalData.phoneNumber}`, 25, yPosition)
      yPosition += 5
      doc.text(`Payment Method: M-Pesa`, 25, yPosition)
      yPosition += 10
      
      // Status Section
      doc.setFontSize(12)
      doc.text(`Status: PENDING ADMIN APPROVAL`, 25, yPosition)
      
      // Footer (matching checkout receipt)
      yPosition += 15
      doc.line(20, yPosition, 190, yPosition)
      yPosition += 10
      doc.setFontSize(8)
      doc.text(`Generated on: ${new Date().toLocaleString('en-KE')}`, 105, yPosition, { align: 'center' })
      
      // Additional footer information
      const pageHeight = doc.internal.pageSize.height
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text('This is an automated receipt. Processing time: 24 hours', 105, pageHeight - 30, { align: 'center' })
      doc.text('For inquiries, contact: +254718176584', 105, pageHeight - 20, { align: 'center' })
      doc.text('Think Twice Resellers - Your trusted marketplace', 105, pageHeight - 10, { align: 'center' })
      
      return doc
    } catch (error) {
      console.error('Error generating PDF:', error)
      return null
    }
  }


  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated && !loading) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, loading, router])

  // Fetch user data
  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      const fetchAllData = async () => {
        setLoading(true)
        try {
          // Fetch data in sequence to avoid race conditions
          await fetchUserOrders()
          await fetchUserSales() // Fetch sales first
          await fetchUserProducts() // Then products (which will add sold products to sales)
          await fetchUserWithdrawals()
          await fetchUserProfile()
          await fetchDeliveryAddress()
        } catch (error) {
          console.error('❌ Error fetching user data:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchAllData()
    }
  }, [mounted, isAuthenticated, user])

  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profilePicture: user.profile?.profilePicture || ''
      })
    }
  }, [user])

  const fetchUserOrders = async () => {
    try {
      const response = await fetch('/api/user/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchUserProducts = async () => {
    try {
      const response = await fetch('/api/user/products')
      if (response.ok) {
        const data = await response.json()
        const allProducts = data.products || []
        
        // Separate products by status
        const activeProducts = allProducts.filter(product => product.status !== 'sold')
        const soldProducts = allProducts.filter(product => product.status === 'sold')
        
        console.log(`📦 Products loaded: ${activeProducts.length} active, ${soldProducts.length} sold`)
        
        // Set active products to the products state
        setProducts(activeProducts)
        
        // Add sold products to sales state
        if (soldProducts.length > 0) {
          const soldProductsAsSales = soldProducts.map(product => ({
            _id: product._id,
            productName: product.name,
            saleAmount: product.price,
            saleDate: product.createdAt,
            type: 'product_sale',
            productImage: product.image,
            withdrawalRequested: product.withdrawalRequested || false,
            status: 'sold'
          }))
          
          // Update sales state by adding sold products
          setSales(prevSales => {
            // Filter out any existing product sales to avoid duplicates
            const nonProductSales = prevSales.filter(sale => sale.type !== 'product_sale')
            // Combine with new sold products
            return [...nonProductSales, ...soldProductsAsSales].sort((a, b) => 
              new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt)
            )
          })
        }
        
      } else {
        console.error('❌ Failed to fetch products:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error)
    }
  }

  const fetchUserSales = async () => {
    try {
      const response = await fetch('/api/user/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales || [])
      } else {
        console.error('❌ Failed to fetch sales:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching sales:', error)
    }
  }

  const fetchUserWithdrawals = async () => {
    try {
      const response = await fetch('/api/user/withdrawals')
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        const userData = data.user
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          profilePicture: userData.profile?.profilePicture || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchDeliveryAddress = async (forceUpdate = false) => {
    if (editingAddress && !forceUpdate) {
      console.log('⚠️ Skipping address fetch - user is editing')
      return
    }

    try {
      console.log('🔄 Fetching delivery address from database...')
      const response = await fetch('/api/user/delivery-address')
      
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Raw API response:', data)
        
        const address = data.deliveryAddress
        const addressInfo = {
          fullName: address?.fullName || '',
          phone: address?.phone || '',
          street: address?.street || '',
          town: address?.city || '',
          region: address?.region || '',
          additionalInstructions: address?.additionalInstructions || ''
        }
        
        setAddressData(addressInfo)
        setOriginalAddressData(addressInfo)
        
        if (!editingAddress) {
          setAddressFormData(addressInfo)
        }
        
        console.log('📍 Delivery address loaded and set:', addressInfo)
        
        const hasData = address?.fullName || address?.street || address?.city
        console.log('📊 Has saved address data:', hasData)
        
      } else {
        console.error('❌ Failed to fetch delivery address:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('❌ Network error fetching delivery address:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      logout()
      router.push('/')
    }
  }

  // Get recent orders and sales from last 60 days
  const getRecentActivity = () => {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= sixtyDaysAgo
    )

    const recentSales = sales.filter(sale => 
      new Date(sale.createdAt || sale.saleDate) >= sixtyDaysAgo
    )

    return { recentOrders, recentSales }
  }

  // Show loading until component is mounted and auth is checked
  if (!mounted || !isAuthenticated || loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        .blink-icon {
          animation: blink 1.5s ease-in-out infinite alternate;
        }
        @keyframes blink {
          0% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
      {/* Header Section */}
      <div style={{
        backgroundColor: 'var(--bg)',
        padding: '20px 16px',
        color: 'var(--text)',
        position: 'relative'
      }}>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {user?.profile?.profilePicture ? (
              <img src={user.profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              '👤'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {user?.name || 'User'}
              </h2>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                {user?.email || 'user@example.com'}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {user?.phone || 'Phone not provided'}
            </p>
          </div>
        </div>

      </div>

      {/* Content Container */}
      <div style={{ padding: '16px' }}>
        
        {/* Overview Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>Overview</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '12px',
            backgroundColor: 'var(--surface)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <div 
              style={{ 
                textAlign: 'left', 
                cursor: 'pointer', 
                paddingLeft: window.innerWidth >= 1024 ? '40px' : '30px' 
              }}
              onClick={() => setShowRecentModal(true)}
            >
              <div style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: '600' }}>📊</div>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', marginTop: '4px' }}>Recent</div>
            </div>
            
            <div 
              style={{ 
                textAlign: 'left', 
                cursor: 'pointer', 
                paddingLeft: window.innerWidth >= 1024 ? '40px' : '30px' 
              }}
              onClick={() => setShowOrdersModal(true)}
            >
              <div style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: '600' }}>📋</div>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', marginTop: '4px' }}>Orders ({orders.length})</div>
            </div>
            
            <div 
              style={{ 
                textAlign: 'left', 
                cursor: 'pointer', 
                paddingLeft: window.innerWidth >= 1024 ? '40px' : '30px' 
              }}
              onClick={() => setShowProductsModal(true)}
            >
              <div style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: '600' }}>📦</div>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', marginTop: '4px' }}>Products ({products.length})</div>
            </div>
            
            <div 
              style={{ 
                textAlign: 'left', 
                cursor: 'pointer', 
                paddingLeft: window.innerWidth >= 1024 ? '40px' : '30px' 
              }}
              onClick={() => setShowSalesModal(true)}
            >
              <div style={{ fontSize: '20px', color: 'var(--primary)', fontWeight: '600' }}>💰</div>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500', marginTop: '4px' }}>Sales ({sales.length})</div>
            </div>
          </div>
        </div>

        {/* My Services Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>My Services</h3>
          
          <div style={{ 
            backgroundColor: 'var(--surface)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            {/* Services Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
              <button
                onClick={() => setShowAccountManagement(true)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏠</div>
                <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>Address</div>
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>👤</div>
                <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>Profile</div>
              </button>
              
              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🚪</div>
                <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>Log Out</div>
              </button>
              
              <button
                onClick={() => setShowDeleteAccount(true)}
                style={{ 
                  background: 'none',
                  border: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🗑️</div>
                <div style={{ fontSize: '12px', color: '#dc3545', fontWeight: '500' }}>Account</div>
              </button>
            </div>
          </div>
        </div>


      </div>

      {/* Account Management Modal */}
      {showAccountManagement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>📍 Address Book</h3>
              <button
                onClick={() => setShowAccountManagement(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Delivery Address Management */}
            <div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>
                  🚚 Delivery Address
                </h4>
                {!editingAddress && (
                  <button
                    onClick={() => {
                      setEditingAddress(true)
                      // Copy current address data to form data for editing
                      setAddressFormData(addressData)
                      setOriginalAddressData(addressData)
                      console.log('📝 Started editing address, copied to form data')
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {!editingAddress ? (
                <div>
                  {addressData.fullName ? (
                    <div style={{ display: 'grid', gap: '12px', color: 'var(--text)' }}>
                      <div><strong>Full Name:</strong> {addressData.fullName}</div>
                      <div><strong>Phone:</strong> {addressData.phone}</div>
                      <div><strong>Address:</strong> {addressData.street}</div>
                      <div><strong>Town:</strong> {addressData.town}</div>
                      <div><strong>Region:</strong> {addressData.region}</div>
                      {addressData.additionalInstructions && (
                        <div><strong>Instructions:</strong> {addressData.additionalInstructions}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px',
                      color: '#666'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>📍</div>
                      <p>No delivery address saved</p>
                      <small>Add your address to speed up checkout</small>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.fullName}
                      onChange={(e) => setAddressFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)'
                      }}
                      placeholder="Enter full name for delivery"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={addressFormData.phone}
                      onChange={(e) => setAddressFormData(prev => ({ ...prev, phone: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)'
                      }}
                      placeholder="0712345678"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={addressFormData.street}
                      onChange={(e) => setAddressFormData(prev => ({ ...prev, street: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)'
                      }}
                      placeholder="Enter street address"
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                        Town *
                      </label>
                      <input
                        type="text"
                        value={addressFormData.town}
                        onChange={(e) => setAddressFormData(prev => ({ ...prev, town: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)'
                        }}
                        placeholder="Town"
                      />
                    </div>
                    
                    {/* Separator */}
                    <div style={{
                      width: '1px',
                      height: '40px',
                      backgroundColor: 'var(--border)',
                      alignSelf: 'center'
                    }}></div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                        Region *
                      </label>
                      <input
                        type="text"
                        value={addressFormData.region}
                        onChange={(e) => setAddressFormData(prev => ({ ...prev, region: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)'
                        }}
                        placeholder="Region"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                      Additional Instructions
                    </label>
                    <textarea
                      value={addressFormData.additionalInstructions}
                      onChange={(e) => setAddressFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minHeight: '60px',
                        resize: 'vertical',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)'
                      }}
                      placeholder="Delivery instructions (optional)"
                    />
                  </div>

                  {addressErrors.general && (
                    <div style={{ color: '#dc3545', fontSize: '14px' }}>
                      {addressErrors.general}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={async () => {
                        setAddressErrors({})
                        setAddressLoading(true)

                        // Client-side validation
                        if (!addressFormData.fullName || addressFormData.fullName.length < 2) {
                          setAddressErrors({ general: 'Full name must be at least 2 characters long' })
                          setAddressLoading(false)
                          return
                        }

                        if (!addressFormData.phone || !/^(\+254|254|0)[17]\d{8}$/.test(addressFormData.phone)) {
                          setAddressErrors({ general: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' })
                          setAddressLoading(false)
                          return
                        }

                        if (!addressFormData.street || addressFormData.street.length < 5) {
                          setAddressErrors({ general: 'Street address must be at least 5 characters long' })
                          setAddressLoading(false)
                          return
                        }

                        if (!addressFormData.town || addressFormData.town.length < 2) {
                          setAddressErrors({ general: 'Town must be at least 2 characters long' })
                          setAddressLoading(false)
                          return
                        }

                        if (!addressFormData.region || addressFormData.region.length < 2) {
                          setAddressErrors({ general: 'Region must be at least 2 characters long' })
                          setAddressLoading(false)
                          return
                        }

                        try {
                          console.log('Sending address update request with data:', addressFormData)
                          
                          const response = await fetch('/api/user/delivery-address', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...addressFormData,
                              city: addressFormData.town
                            })
                          })

                          const data = await response.json()
                          console.log('Address update response:', data)

                          if (response.ok) {
                            console.log('✅ Save response:', data)
                            
                            alert('Delivery address updated successfully!')
                            
                            // Update all states with the saved data
                            setAddressData(addressFormData)
                            setOriginalAddressData(addressFormData)
                            setEditingAddress(false)
                            
                            console.log('✅ Address saved successfully, updated all data')
                            console.log('✅ Form data that was saved:', addressFormData)
                            
                            // Verify by fetching fresh data from database
                            setTimeout(() => {
                              console.log('🔄 Verifying save by fetching fresh data...')
                              fetchDeliveryAddress(true)
                            }, 500)
                          } else {
                            console.error('Address update failed:', data.error)
                            setAddressErrors({ general: data.error || 'Failed to update delivery address' })
                          }
                        } catch (error) {
                          console.error('Address update network error:', error)
                          setAddressErrors({ general: 'Network error. Please check your connection and try again.' })
                        } finally {
                          setAddressLoading(false)
                        }
                      }}
                      disabled={addressLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: addressLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        opacity: addressLoading ? 0.6 : 1
                      }}
                    >
                      {addressLoading ? 'Saving...' : '💾 Save Address'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAddress(false)
                        setAddressErrors({})
                        // Reset form data to original data
                        setAddressFormData(originalAddressData)
                        console.log('🔄 Address form cancelled, restored original data to form')
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>👤 Profile</h3>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Profile Information Section */}
            <div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text)' }}>
                  👤 User Information
                </h4>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              {!editingProfile ? (
                <div>
                  {/* Profile Picture Display */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      overflow: 'hidden'
                    }}>
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '32px' }}>👤</span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '12px', color: 'var(--text)' }}>
                    <div>
                      <strong>Name:</strong> {profileData.name}
                    </div>
                    <div>
                      <strong>Email:</strong> {profileData.email}
                    </div>
                    <div>
                      <strong>Phone:</strong> {profileData.phone}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Profile Picture Upload */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px dashed #007bff'
                    }}
                    onClick={() => document.getElementById('profilePictureSettings').click()}
                    >
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture} 
                          alt="Profile" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '24px' }}>📷</span>
                      )}
                    </div>
                    <input
                      id="profilePictureSettings"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) { // 5MB limit
                            alert('Image size must be less than 5MB')
                            return
                          }

                          const reader = new FileReader()
                          reader.onload = (e) => {
                            setProfileData(prev => ({
                              ...prev,
                              profilePicture: e.target.result
                            }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <small style={{ color: '#666' }}>Click to change photo</small>
                  </div>

                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)'
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)'
                        }}
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: 'var(--text)' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)'
                        }}
                        placeholder="0712345678"
                      />
                    </div>

                    {profileErrors.general && (
                      <div style={{ color: '#dc3545', fontSize: '14px' }}>
                        {profileErrors.general}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        onClick={async () => {
                          setProfileErrors({})
                          setProfileLoading(true)

                          // Client-side validation
                          if (!profileData.name || profileData.name.length < 2) {
                            setProfileErrors({ general: 'Name must be at least 2 characters long' })
                            setProfileLoading(false)
                            return
                          }

                          if (!profileData.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(profileData.email)) {
                            setProfileErrors({ general: 'Please enter a valid email address' })
                            setProfileLoading(false)
                            return
                          }

                          if (!profileData.phone || !/^(\+254|254|0)[17]\d{8}$/.test(profileData.phone)) {
                            setProfileErrors({ general: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' })
                            setProfileLoading(false)
                            return
                          }

                          try {
                            console.log('Sending profile update request with data:', profileData)
                            
                            const response = await fetch('/api/user/profile', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(profileData)
                            })

                            const data = await response.json()
                            console.log('Profile update response:', data)

                            if (response.ok) {
                              alert('Profile updated successfully!')
                              setEditingProfile(false)
                              // Refresh user data
                              fetchUserProfile()
                              // Also refresh the AuthContext to update the header display
                              checkAuthStatus()
                            } else {
                              console.error('Profile update failed:', data.error)
                              setProfileErrors({ general: data.error || 'Failed to update profile' })
                            }
                          } catch (error) {
                            console.error('Profile update network error:', error)
                            setProfileErrors({ general: 'Network error. Please check your connection and try again.' })
                          } finally {
                            setProfileLoading(false)
                          }
                        }}
                        disabled={profileLoading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: profileLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: profileLoading ? 0.6 : 1
                        }}
                      >
                        {profileLoading ? 'Saving...' : '💾 Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProfile(false)
                          setProfileErrors({})
                          // Reset to original data
                          setProfileData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            profilePicture: user?.profile?.profilePicture || ''
                          })
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid var(--border)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚠️</div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#dc3545', marginBottom: '10px' }}>
                Delete Account
              </h3>
              <p style={{ margin: 0, fontSize: '16px', color: 'var(--text)', lineHeight: '1.5' }}>
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove:
              </p>
            </div>

            <div style={{ 
              backgroundColor: 'var(--surface)', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid var(--border)'
            }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '14px' }}>
                <li>Your profile and personal information</li>
                <li>All your orders and purchase history</li>
                <li>Your listed products and sales data</li>
                <li>Saved addresses and preferences</li>
                <li>All account data and settings</li>
              </ul>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '7px', 
                fontWeight: '500', 
                color: 'var(--text)',
                fontSize: '13px'
              }}>
                To confirm deletion, please enter your email address:
              </label>
              <input
                type="email"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={user?.email || 'Enter your email'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  fontSize: '13px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#dc3545'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              {deleteConfirmEmail && deleteConfirmEmail !== user?.email && (
                <div style={{ 
                  color: '#dc3545', 
                  fontSize: '12px', 
                  marginTop: '5px',
                  fontWeight: '500'
                }}>
                  Email does not match your account email
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteAccount(false)
                  setDeleteConfirmEmail('')
                }}
                disabled={deleteLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: deleteLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmEmail !== user?.email) {
                    alert('Please enter your correct email address to confirm deletion.')
                    return
                  }
                  
                  setDeleteLoading(true)
                  try {
                    // Add delete account API call here
                    console.log('Delete account confirmed for:', user?.email)
                    alert('Account deletion feature will be implemented soon. Your request has been logged.')
                    setShowDeleteAccount(false)
                    setDeleteConfirmEmail('')
                  } catch (error) {
                    console.error('Delete account error:', error)
                    alert('Failed to delete account. Please try again.')
                  } finally {
                    setDeleteLoading(false)
                  }
                }}
                disabled={deleteLoading || deleteConfirmEmail !== user?.email}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (deleteLoading || deleteConfirmEmail !== user?.email) ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  opacity: (deleteLoading || deleteConfirmEmail !== user?.email) ? 0.6 : 1
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '320px',
            width: '100%',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚪</div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '600', 
                color: 'var(--text)', 
                marginBottom: '8px' 
              }}>
                Log Out
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'var(--text)', 
                lineHeight: '1.4' 
              }}>
                Are you sure you want to log out of your account?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false)
                  handleLogout()
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '25px',
            maxWidth: '480px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600', 
                color: 'var(--text)', 
                marginBottom: '8px' 
              }}>
                {withdrawalStep === 1 ? 'Withdrawal Request' : 'Payment Method'}
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'var(--text)', 
                lineHeight: '1.5' 
              }}>
                {withdrawalStep === 1 
                  ? 'Request withdrawal for your sold product'
                  : 'Choose your payment method and enter details'
                }
              </p>
            </div>

            {withdrawalStep === 1 ? (
              <>
                {/* Product Information */}
                <div style={{ 
                  backgroundColor: 'var(--surface)', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '18px',
                  border: '1px solid var(--border)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)' 
                  }}>
                    Product Details
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Product:</strong> {selectedProduct.name}
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Sale Price:</strong> Ksh {selectedProduct.price?.toLocaleString('en-KE')}
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Service Fee (15%):</strong> Ksh {Math.round(selectedProduct.price * 0.15)?.toLocaleString('en-KE')}
                    </div>
                    <div style={{ 
                      marginTop: '10px', 
                      paddingTop: '10px', 
                      borderTop: '1px solid var(--border)',
                      fontWeight: '600',
                      color: '#28a745'
                    }}>
                      <strong>You will receive:</strong> Ksh {Math.round(selectedProduct.price * 0.85)?.toLocaleString('en-KE')}
                    </div>
                  </div>
                </div>

                {/* Withdrawal Information */}
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  marginBottom: '18px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#495057' 
                  }}>
                    Important Information
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '18px', 
                    fontSize: '12px', 
                    color: '#6c757d', 
                    lineHeight: '1.5' 
                  }}>
                    <li style={{ marginBottom: '4px' }}>A 15% service fee will be deducted from your sale amount</li>
                    <li style={{ marginBottom: '4px' }}>Withdrawal processing takes 24 hrs</li>
                    <li style={{ marginBottom: '4px' }}>Funds will be transferred to your registered payment method</li>
                    <li style={{ marginBottom: '4px' }}>You will receive an SMS confirmation once processed</li>
                    <li>This action cannot be undone once submitted</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Payment Method Selection */}
                <div style={{ 
                  backgroundColor: 'var(--surface)', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '14px',
                  border: '1px solid var(--border)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)' 
                  }}>
                    Select Payment Method
                  </h4>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px', 
                      border: '2px solid #00a651', 
                      borderRadius: '6px', 
                      backgroundColor: '#f0f8f0',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="paymentMethod" 
                        value="mpesa" 
                        checked={paymentMethod === 'mpesa'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={{ marginRight: '10px' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>📱</span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#00a651' }}>M-Pesa</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>Mobile Money Transfer</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div style={{ 
                  backgroundColor: 'var(--surface)', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '14px',
                  border: '1px solid var(--border)'
                }}>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text)' 
                  }}>
                    M-Pesa Phone Number
                  </h4>
                  <input
                    type="tel"
                    value={withdrawalPhone}
                    onChange={(e) => setWithdrawalPhone(e.target.value)}
                    placeholder="0712345678"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00a651'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666', 
                    marginTop: '6px' 
                  }}>
                    Enter the M-Pesa registered phone number to receive Ksh {Math.round(selectedProduct.price * 0.85)?.toLocaleString('en-KE')}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  marginBottom: '20px',
                  border: '1px solid #00a651'
                }}>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#00a651' 
                  }}>
                    Withdrawal Summary
                  </h4>
                  <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.4' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Product:</strong> {selectedProduct.name}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Amount:</strong> Ksh {Math.round(selectedProduct.price * 0.85)?.toLocaleString('en-KE')}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Method:</strong> M-Pesa
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <strong>Phone:</strong> {withdrawalPhone || 'Not entered'}
                    </div>
                    
                    {/* Send Withdrawal Request Button */}
                    <button
                      onClick={async () => {
                        // Validate phone number
                        if (!withdrawalPhone || withdrawalPhone.length < 10) {
                          alert('Please enter a valid M-Pesa phone number')
                          return
                        }
                        
                        setWithdrawalLoading(true)
                        try {
                          const withdrawalAmount = Math.round(selectedProduct.price * 0.85)
                          const serviceFee = Math.round(selectedProduct.price * 0.15)
                          
                          // Call withdrawal API to automatically submit to admin dashboard
                          const response = await fetch('/api/user/withdrawal', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              productId: selectedProduct._id,
                              phoneNumber: withdrawalPhone,
                              paymentMethod: paymentMethod
                            })
                          })

                          const data = await response.json()

                          if (response.ok && data.success) {
                            // Prepare withdrawal data for receipt
                            const withdrawalData = {
                              id: data.withdrawal.id,
                              productName: selectedProduct.name,
                              salePrice: selectedProduct.price,
                              serviceFee: serviceFee,
                              withdrawalAmount: withdrawalAmount,
                              phoneNumber: withdrawalPhone,
                              status: 'pending'
                            }
                            
                            // Generate PDF receipt
                            const pdfDoc = await generateWithdrawalReceipt(withdrawalData)
                            
                            // Store receipt data for modal
                            setWithdrawalReceipt({
                              ...withdrawalData,
                              pdfDoc: pdfDoc
                            })
                            
                            // Close withdrawal modal and show receipt modal
                            setShowWithdrawalModal(false)
                            setSelectedProduct(null)
                            setWithdrawalStep(1)
                            setWithdrawalPhone('')
                            setShowReceiptModal(true)
                            
                            // Refresh products to show withdrawal status
                            fetchUserProducts()
                          } else {
                            alert(data.error || 'Failed to submit withdrawal request. Please try again.')
                          }
                        } catch (error) {
                          console.error('Withdrawal request error:', error)
                          alert('Failed to submit withdrawal request. Please check your connection and try again.')
                        } finally {
                          setWithdrawalLoading(false)
                        }
                      }}
                      disabled={withdrawalLoading || !withdrawalPhone || withdrawalPhone.length < 10}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        backgroundColor: '#00a651',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: (withdrawalLoading || !withdrawalPhone || withdrawalPhone.length < 10) ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        opacity: (withdrawalLoading || !withdrawalPhone || withdrawalPhone.length < 10) ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {withdrawalLoading ? (
                        <>
                          <span>⏳</span>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          <span>Send Withdrawal Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {withdrawalStep === 2 && (
                <button
                  onClick={() => setWithdrawalStep(1)}
                  disabled={withdrawalLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: withdrawalLoading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    opacity: withdrawalLoading ? 0.6 : 1
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => {
                  setShowWithdrawalModal(false)
                  setSelectedProduct(null)
                  setWithdrawalStep(1)
                  setWithdrawalPhone('')
                }}
                disabled={withdrawalLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: withdrawalLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  opacity: withdrawalLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (withdrawalStep === 1) {
                    setWithdrawalStep(2)
                  }
                }}
                disabled={withdrawalLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: withdrawalStep === 1 ? '#28a745' : 'var(--surface)',
                  color: withdrawalStep === 1 ? 'white' : 'var(--text)',
                  border: withdrawalStep === 1 ? 'none' : '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: withdrawalLoading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  opacity: withdrawalLoading ? 0.6 : 1,
                  display: withdrawalStep === 2 ? 'none' : 'block'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notification Modal */}
      {showAdminNotificationModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '25px',
            maxWidth: '450px',
            width: '100%',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600', 
                color: 'var(--text)', 
                marginBottom: '10px' 
              }}>
                Admin Notification Required
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'var(--text)', 
                lineHeight: '1.5',
                marginBottom: '15px'
              }}>
                Before processing your withdrawal request, we need to notify our admin for quick review.
              </p>
              
              {/* Withdrawal Summary in Modal */}
              <div style={{ 
                backgroundColor: 'var(--surface)', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid var(--border)',
                textAlign: 'left'
              }}>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: 'var(--text)' 
                }}>
                  Withdrawal Details
                </h4>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Product:</strong> {selectedProduct.name}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Amount:</strong> Ksh {Math.round(selectedProduct.price * 0.85)?.toLocaleString('en-KE')}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>M-Pesa:</strong> {withdrawalPhone}
                  </div>
                </div>
              </div>
              
              <p style={{ 
                margin: 0, 
                fontSize: '13px', 
                color: 'var(--muted)', 
                lineHeight: '1.4'
              }}>
                Click "Send WhatsApp" to notify admin, then your withdrawal will be processed automatically.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowAdminNotificationModal(false)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Create WhatsApp message
                    const adminPhone = '254718176584'
                    const withdrawalAmount = Math.round(selectedProduct.price * 0.85)
                    const serviceFee = Math.round(selectedProduct.price * 0.15)
                    
                    const whatsappMessage = `🔔 *WITHDRAWAL REQUEST ALERT*

📱 *Product Details:*
• Product: ${selectedProduct.name}
• Sale Price: Ksh ${selectedProduct.price?.toLocaleString('en-KE')}
• Service Fee (15%): Ksh ${serviceFee.toLocaleString('en-KE')}
• Withdrawal Amount: Ksh ${withdrawalAmount.toLocaleString('en-KE')}

💰 *Payment Details:*
• Method: M-Pesa
• Phone: ${withdrawalPhone}
• User: ${user?.name || 'Unknown'}
• User Phone: ${user?.phone || 'Not provided'}

⏰ *Request Time:* ${new Date().toLocaleString()}

🔍 *Action Required:* Please review and process this withdrawal request.

---
*Think Twice Resellers - Admin Alert*`

                    // Create WhatsApp URL and open
                    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(whatsappMessage)}`
                    window.open(whatsappUrl, '_blank')
                    
                    // Close notification modal
                    setShowAdminNotificationModal(false)
                    
                    // Wait a moment then process withdrawal
                    setWithdrawalLoading(true)
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    
                    // Call withdrawal API
                    const response = await fetch('/api/user/withdrawal', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        productId: selectedProduct._id,
                        phoneNumber: withdrawalPhone,
                        paymentMethod: paymentMethod
                      })
                    })

                    const data = await response.json()

                    if (response.ok && data.success) {
                      alert(`✅ Withdrawal request submitted successfully!\n\n📱 Admin has been notified via WhatsApp for quick review.\n\nProduct: ${selectedProduct.name}\nAmount: Ksh ${withdrawalAmount.toLocaleString('en-KE')}\nM-Pesa Number: ${withdrawalPhone}\n\n📲 You will receive an SMS confirmation within 24 hours.`)
                      
                      setShowWithdrawalModal(false)
                      setSelectedProduct(null)
                      setWithdrawalStep(1)
                      setWithdrawalPhone('')
                      
                      // Refresh products to show withdrawal status
                      fetchUserProducts()
                    } else {
                      alert(data.error || 'Failed to submit withdrawal request. Please try again.')
                    }
                  } catch (error) {
                    console.error('Withdrawal request error:', error)
                    alert('Failed to submit withdrawal request. Please check your connection and try again.')
                  } finally {
                    setWithdrawalLoading(false)
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📱</span>
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Download Modal */}
      {showReceiptModal && withdrawalReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: 16,
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            {/* Success Header */}
            <div style={{
              fontSize: '64px',
              marginBottom: '16px',
              animation: 'bounce 1s ease-in-out'
            }}>
              ✅
            </div>
            
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text)',
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Withdrawal Request Submitted!
            </h3>
            
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              color: 'var(--muted)',
              lineHeight: '1.5'
            }}>
              Your withdrawal request has been automatically sent to the admin dashboard for processing.
            </p>
            
            {/* Receipt Summary */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text)',
                textAlign: 'center'
              }}>
                📄 Receipt Summary
              </h4>
              
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Product:</span>
                  <span style={{ color: 'var(--text)', fontWeight: '500' }}>{withdrawalReceipt.productName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Sale Price:</span>
                  <span style={{ color: 'var(--text)' }}>KSh {withdrawalReceipt.salePrice.toLocaleString('en-KE')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Service Fee (15%):</span>
                  <span style={{ color: '#dc3545' }}>-KSh {withdrawalReceipt.serviceFee.toLocaleString('en-KE')}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text)', fontWeight: '600' }}>Withdrawal Amount:</span>
                  <span style={{ color: '#28a745', fontWeight: '700', fontSize: '16px' }}>
                    KSh {withdrawalReceipt.withdrawalAmount.toLocaleString('en-KE')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>M-Pesa Number:</span>
                  <span style={{ color: 'var(--text)' }}>{withdrawalReceipt.phoneNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Status:</span>
                  <span style={{ 
                    color: '#ff8c00', 
                    fontWeight: '600',
                    padding: '2px 8px',
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    ⏳ Pending Admin Approval
                  </span>
                </div>
              </div>
            </div>
            
            {/* Processing Info */}
            <div style={{
              backgroundColor: 'rgba(40, 167, 69, 0.1)',
              border: '1px solid rgba(40, 167, 69, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.5' }}>
                <strong>📋 Next Steps:</strong><br />
                • Your request is now in the admin dashboard<br />
                • Processing time: 24 hours<br />
                • You'll receive SMS confirmation once processed<br />
                • Download your receipt for records
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  if (withdrawalReceipt.pdfDoc) {
                    withdrawalReceipt.pdfDoc.save(`withdrawal-receipt-${withdrawalReceipt.id.slice(-8)}.pdf`)
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)'
                }}
              >
                <span>📥</span>
                <span>Download Receipt PDF</span>
              </button>
              
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setWithdrawalReceipt(null)
                }}
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--border)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--surface)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>📦 My Listed Products</h3>
              <button
                onClick={() => setShowProductsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', lineHeight: 1.5, color: '#666' }}>
              Products you have listed for sale on the platform.
            </p>
            
            {products.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
                <h3 style={{ marginBottom: '10px' }}>No products listed</h3>
                <p>Start selling by adding your first product!</p>
                <Link 
                  href="/sell" 
                  style={{
                    display: 'inline-block',
                    background: '#28a745',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '14px',
                    borderRadius: '6px',
                    textDecoration: 'none'
                  }}
                >
                  Add Product
                </Link>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0'
              }}>
                {products.map((product, index) => (
                  <div
                    key={product._id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'var(--surface)'
                    }}
                  >
                    {/* Product Image */}
                    <img 
                      src={product.image || '/placeholder.jpg'} 
                      alt={product.name} 
                      width={70} 
                      height={56} 
                      style={{ 
                        objectFit: 'cover', 
                        borderRadius: '5px',
                        backgroundColor: '#f0f0f0'
                      }} 
                    />
                    
                    {/* Product Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: 'var(--text)' }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                            KSh {product.price?.toLocaleString() || 0}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          {/* Only show status badge for non-approved products */}
                          {!(product.status === 'approved' || product.status === 'available') && (
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: 
                                product.status === 'pending' ? '#ffc107' :
                                product.status === 'rejected' ? '#dc3545' :
                                product.status === 'sold' ? '#17a2b8' : '#6c757d',
                              color: 
                                product.status === 'pending' ? '#000' : '#fff',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500',
                              minWidth: '80px',
                              textAlign: 'center',
                              display: 'inline-block'
                            }}>
                              {product.status === 'pending' ? '⏳ Pending' :
                               product.status === 'rejected' ? '❌ Rejected' :
                               product.status === 'sold' ? '💰 Sold' :
                               product.status}
                            </span>
                          )}
                          
                          {/* Live on Website Notification for approved products */}
                          {(product.status === 'approved' || product.status === 'available') && product.status !== 'sold' && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '500',
                              color: '#28a745'
                            }}>
                              <span className="blink-icon">🌐</span> Live on Website
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          Listed: {new Date(product.createdAt).toLocaleDateString()}
                        </div>
                        
                        {/* Action buttons for sold products */}
                        {product.status === 'sold' && !product.withdrawalRequested && (
                          <button
                            onClick={() => {
                              setSelectedProduct(product)
                              setWithdrawalStep(1)
                              setWithdrawalPhone('')
                              setShowProductsModal(false)
                              setShowWithdrawalModal(true)
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Request Withdrawal
                          </button>
                        )}
                        
                        {product.withdrawalRequested && (
                          <WithdrawalStatusBadge 
                            saleId={product._id} 
                            userId={user?.id} 
                            initialStatus="pending"
                          />
                        )}
                      </div>
                      
                      {/* Rejection Reason */}
                      {product.status === 'rejected' && product.rejectionReason && (
                        <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '4px' }}>
                          ❌ Rejection Reason: {product.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrdersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>📋 My Orders</h3>
              <button
                onClick={() => setShowOrdersModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <p>No orders yet</p>
                <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Start shopping →</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {orders.map((order) => (
                  <div key={order._id} style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'var(--surface)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>Order #{order._id.slice(-8)}</div>
                      <div style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        backgroundColor: order.status === 'completed' ? '#d4edda' : '#fff3cd',
                        color: order.status === 'completed' ? '#155724' : '#856404'
                      }}>
                        {order.status}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>
                      Total: KSh {order.totalAmount}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales Modal */}
      {showSalesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>💰 Sales History</h3>
              <button
                onClick={() => setShowSalesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>
            
            {sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                <p>No sales yet</p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0'
              }}>
                {sales.map((sale) => (
                  <div
                    key={sale._id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'var(--surface)'
                    }}
                  >
                    {/* Product Image for sold products */}
                    {sale.type === 'product_sale' && (
                      <img 
                        src={sale.productImage || '/placeholder.jpg'} 
                        alt={sale.productName} 
                        width={70} 
                        height={56} 
                        style={{ 
                          objectFit: 'cover', 
                          borderRadius: '5px',
                          backgroundColor: '#f0f0f0'
                        }} 
                      />
                    )}
                    
                    {/* Sale Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: 'var(--text)' }}>
                            {sale.type === 'product_sale' ? sale.productName : `Sale #${sale._id.slice(-8)}`}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                            KSh {sale.saleAmount || sale.amount}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span style={{
                            padding: '4px 8px',
                            backgroundColor: '#28a745',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            minWidth: '80px',
                            textAlign: 'center',
                            display: 'inline-block'
                          }}>
                            💰 Sold
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ flex: 1 }} />
                      
                      {/* Bottom row with date and actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '7px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          Listed: {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
                        </div>
                        
                        {/* Action buttons for sold products */}
                        {sale.type === 'product_sale' && !sale.withdrawalRequested && (
                          <button
                            onClick={() => {
                              setSelectedProduct({
                                _id: sale._id,
                                name: sale.productName,
                                price: sale.saleAmount,
                                status: 'sold'
                              })
                              setWithdrawalStep(1)
                              setWithdrawalPhone('')
                              setShowSalesModal(false)
                              setShowWithdrawalModal(true)
                            }}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              minWidth: '80px',
                              textAlign: 'center'
                            }}
                          >
                            Withdrawal
                          </button>
                        )}
                        
                        {sale.withdrawalRequested && (
                          <WithdrawalStatusBadge 
                            saleId={sale._id} 
                            userId={user?.id} 
                            initialStatus="pending"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Modal */}
      {showRecentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>📊 Recent Activity (Last 60 Days)</h3>
              <button
                onClick={() => setShowRecentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const { recentOrders, recentSales } = getRecentActivity()
              const hasRecentActivity = recentOrders.length > 0 || recentSales.length > 0
              
              return hasRecentActivity ? (
                <div style={{ display: 'grid', gap: '24px' }}>
                  {/* Recent Orders Section */}
                  {recentOrders.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                        📋 Recent Orders ({recentOrders.length})
                      </h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {recentOrders.map((order) => (
                          <div key={order._id} style={{
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: 'var(--surface)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>Order #{order._id.slice(-8)}</div>
                              <div style={{ 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                backgroundColor: order.status === 'completed' ? '#d4edda' : '#fff3cd',
                                color: order.status === 'completed' ? '#155724' : '#856404'
                              }}>
                                {order.status}
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '4px' }}>
                              Total: KSh {order.totalAmount}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sales Section */}
                  {recentSales.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text)' }}>
                        💰 Recent Sales ({recentSales.length})
                      </h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        {recentSales.map((sale) => (
                          <div key={sale._id} style={{
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: 'var(--surface)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>
                                {sale.type === 'product_sale' ? sale.productName : `Sale #${sale._id.slice(-8)}`}
                              </div>
                              <div style={{ 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                backgroundColor: '#28a745',
                                color: '#fff'
                              }}>
                                💰 Sold
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                              KSh {sale.saleAmount || sale.amount}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <p>No recent activity in the last 60 days</p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>Orders and sales will appear here once you start trading</p>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
