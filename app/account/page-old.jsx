'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../components/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAccountManagement, setShowAccountManagement] = useState(false)
  
  // Account management states
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
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
  
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Fetch user data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserOrders()
      fetchUserProducts()
      fetchUserSales()
      fetchUserWithdrawals()
      fetchUserProfile()
      fetchDeliveryAddress()
    }
  }, [isAuthenticated, user])

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

  // Debug: Monitor address data changes
  useEffect(() => {
    console.log('🔍 Address data changed:', addressData)
    console.log('🔍 Editing address:', editingAddress)
  }, [addressData, editingAddress])

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
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchUserSales = async () => {
    try {
      const response = await fetch('/api/user/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales || [])
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
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
    } finally {
      setLoading(false)
    }
  }

  // Account Management Functions
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
    // Don't overwrite data if user is currently editing (unless forced)
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
          city: address?.city || '',
          region: address?.region || '',
          additionalInstructions: address?.additionalInstructions || ''
        }
        
        setAddressData(addressInfo)
        setOriginalAddressData(addressInfo) // Store original for cancel functionality
        
        // Also update form data if not editing
        if (!editingAddress) {
          setAddressFormData(addressInfo)
        }
        
        console.log('📍 Delivery address loaded and set:', addressInfo)
        
        // Check if we actually have saved data
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

  const handleProfileUpdate = async () => {
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
  }

  const handleAddressUpdate = async () => {
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

    if (!addressFormData.city || addressFormData.city.length < 2) {
      setAddressErrors({ general: 'City must be at least 2 characters long' })
      setAddressLoading(false)
      return
    }

    if (!addressFormData.region || addressFormData.region.length < 2) {
      setAddressErrors({ general: 'Region/County must be at least 2 characters long' })
      setAddressLoading(false)
      return
    }

    try {
      console.log('Sending address update request with data:', addressFormData)
      
      const response = await fetch('/api/user/delivery-address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressFormData)
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
  }

  const handlePasswordChange = async () => {
    setPasswordErrors({})
    setPasswordLoading(true)

    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match' })
      setPasswordLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Password changed successfully!')
        setChangingPassword(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setPasswordErrors({ general: data.error })
      }
    } catch (error) {
      setPasswordErrors({ general: 'Failed to change password' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleImageUpload = (event) => {
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
  }

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: '', color: '#ccc' }
    
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isLongEnough = password.length >= 8
    
    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough].filter(Boolean).length
    
    if (score < 2) return { score, text: 'Weak', color: '#dc3545' }
    if (score < 4) return { score, text: 'Medium', color: '#ffc107' }
    return { score, text: 'Strong', color: '#28a745' }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const requestWithdrawal = async (productId, paymentMethod = 'mpesa', paymentDetails = {}) => {
    try {
      const response = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          paymentMethod,
          paymentDetails,
          sellerNotes: 'Withdrawal request from account page'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(`Withdrawal request submitted successfully! You will receive Ksh ${data.withdrawal.withdrawalAmount} after admin approval.`)
        // Refresh data
        fetchUserProducts()
        fetchUserWithdrawals()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
      alert('Failed to submit withdrawal request. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'received': return '#17a2b8'
      case 'processing': return '#ffc107'
      case 'in_transit': return '#fd7e14'
      case 'delivered': return '#28a745'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received': return '📋'
      case 'processing': return '⚙️'
      case 'in_transit': return '🚚'
      case 'delivered': return '📦'
      default: return '📄'
    }
  }

  if (!isAuthenticated || loading) {
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
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
        padding: '20px 16px',
        color: 'white',
        position: 'relative'
      }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>23:26</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>🇰🇪</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              '👤'
            )}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              {user?.name || 'User'}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '20px' }}>❤️</div>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>My Wishlist</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '20px' }}>🏪</div>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>Followed Stores</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{ fontSize: '20px' }}>🕒</div>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>Recently Viewed</span>
          </div>
        </div>
      </div>


      {/* Content Container */}
      <div style={{ padding: '16px' }}>
        
        {/* My Orders Section */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>My Orders</h3>
            <Link href="#" style={{ fontSize: '14px', color: '#666', textDecoration: 'none' }}>View All →</Link>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '12px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#ff6b6b', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 8px',
                fontSize: '18px'
              }}>💳</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Unpaid</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#4ecdc4', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 8px',
                fontSize: '18px'
              }}>📦</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>To be Shipped</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#45b7d1', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 8px',
                fontSize: '18px'
              }}>🚚</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Shipped</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#96ceb4', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 8px',
                fontSize: '18px'
              }}>📝</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>To be Reviewed</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: '#feca57', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 8px',
                fontSize: '18px'
              }}>↩️</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Return/Refund</div>
            </div>
          </div>
        </div>

        {/* Promotional Banner */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '12px', color: '#feca57', marginBottom: '4px' }}>BLACK FRIDAY</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              Claim BF Early Bird Voucher
            </h4>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Category Voucher</div>
            <div style={{ fontSize: '14px', color: '#feca57', fontWeight: '600', marginTop: '4px' }}>
              Total KSh 2,230 OFF
            </div>
          </div>
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '60px',
            height: '40px',
            backgroundColor: 'rgba(254, 202, 87, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>🎟️</div>
        </div>

        {/* My Assets Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>My Assets</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '12px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', color: '#ff6b6b', fontWeight: '600' }}>****</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500', marginTop: '4px' }}>Wallet</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', color: '#ff6b6b', fontWeight: '600' }}>0</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500', marginTop: '4px' }}>Vouchers</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', color: '#ff6b6b', fontWeight: '600' }}>0</div>
              <div style={{ fontSize: '12px', color: '#333', fontWeight: '500', marginTop: '4px' }}>Coins</div>
            </div>
          </div>
        </div>

        {/* My Services Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>My Services</h3>
          
          <div style={{ 
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {/* First Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📍</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Address Book</div>
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>💬</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>My Reviews</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>💳</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Sell on Kilimall</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>❓</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>FAQ</div>
              </div>
            </div>
            
            {/* Second Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎧</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Customer Service</div>
              </div>
              
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
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚙️</div>
                <div style={{ fontSize: '12px', color: '#333', fontWeight: '500' }}>Settings</div>
              </button>
              
              <div></div>
              <div></div>
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
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Account Management</h3>
              <button
                onClick={() => setShowAccountManagement(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            
            {/* Account Management Content - Placeholder for now */}
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: '#666', marginBottom: '16px' }}>Account management features will be available here.</p>
              <p style={{ color: '#999', fontSize: '14px' }}>Profile editing, delivery address management, and password changes.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
            backgroundColor: 'transparent',
            color: activeTab === 'sales' ? '#007bff' : '#666',
            border: 'none',
            borderBottom: activeTab === 'sales' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'sales' ? '600' : '500',
            marginRight: '20px'
          }}
        >
          💰 Sales History ({sales.length})
        </button>
        <button
          onClick={() => setActiveTab('account')}
          style={{
            padding: '12px 16px',
            backgroundColor: 'transparent',
            color: activeTab === 'account' ? '#007bff' : '#666',
            border: 'none',
            borderBottom: activeTab === 'account' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'account' ? '600' : '500'
          }}
        >
          ⚙️ Account Management
        </button>
      </div>

      {/* Content */}
      <div>
          {activeTab === 'orders' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>My Orders</h3>
              <p className="meta" style={{ margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.5, color: '#666' }}>
                Track the status of all your orders and see their progress.
              </p>
              
              {orders.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
                  <h3 style={{ marginBottom: '10px' }}>No orders yet</h3>
                  <p>Start shopping to see your orders here!</p>
                  <a 
                    href="/" 
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
                    Start Shopping
                  </a>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {orders.map((order) => (
                    <div
                      key={order.orderId}
                      style={{
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <h3 style={{ 
                            margin: '0 0 5px 0',
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }}>
                            Order #{order.orderId}
                          </h3>
                          <p style={{ 
                            margin: 0,
                            color: '#666',
                            fontSize: '14px'
                          }}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          {getStatusIcon(order.status)} {order.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>
                          Items ({order.items.length}):
                        </p>
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} style={{ 
                            fontSize: '14px',
                            color: '#666',
                            marginBottom: '5px'
                          }}>
                            • {item.name} (Qty: {item.quantity}) - Ksh {item.price.toLocaleString()}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div style={{ 
                            fontSize: '14px',
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            ... and {order.items.length - 3} more items
                          </div>
                        )}
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '15px',
                        borderTop: '1px solid #eee'
                      }}>
                        <div>
                          <strong>Total: Ksh {order.totalAmount.toLocaleString()}</strong>
                          {order.payment.depositPaid && (
                            <div style={{ 
                              fontSize: '12px',
                              color: '#28a745',
                              marginTop: '5px'
                            }}>
                              ✅ Deposit Paid (Ksh {order.payment.depositAmount.toLocaleString()})
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => router.push(`/my-orders/${order.orderId}`)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Sales & Transaction History</h3>
              <p className="meta" style={{ margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.5, color: '#666' }}>
                Completed transactions where you were the seller (based on your contact information).
              </p>
              
              {sales.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
                  <h3 style={{ marginBottom: '10px' }}>No sales transactions found</h3>
                  <p>Sales will appear here when orders are completed using your contact information as the seller.</p>
                  <a 
                    href="/sell" 
                    style={{
                      display: 'inline-block',
                      background: '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: 14,
                      borderRadius: 6,
                      textDecoration: 'none'
                    }}
                  >
                    List Your First Product
                  </a>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                  {sales.map((sale) => (
                    <div
                      key={sale._id}
                      style={{
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        padding: '20px',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px'
                      }}>
                        <div>
                          <h3 style={{ 
                            margin: '0 0 5px 0',
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }}>
                            {sale.productName}
                          </h3>
                          <p style={{ 
                            margin: 0,
                            color: '#666',
                            fontSize: '14px'
                          }}>
                            Sold on {new Date(sale.saleDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>
                          💰 Ksh {sale.saleAmount.toLocaleString()}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '15px',
                        borderTop: '1px solid #eee'
                      }}>
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
                            Buyer: {sale.buyerName}
                          </p>
                          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                            Order: #{sale.orderId}
                          </p>
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          ✅ Completed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>My Listed Products</h3>
              <p className="meta" style={{ margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.5, color: '#666' }}>
                Products you have listed for sale on the platform.
              </p>
              
              {products.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px',
                  background: '#f8f9fa',
                  borderRadius: 8,
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
                  <h3 style={{ marginBottom: '10px' }}>No products listed</h3>
                  <p>Start selling by adding your first product!</p>
                  <a 
                    href="/sell" 
                    style={{
                      display: 'inline-block',
                      background: '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: 14,
                      borderRadius: 6,
                      textDecoration: 'none'
                    }}
                  >
                    Add Product
                  </a>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px'
                }}>
                  {products.map((product) => (
                    <div
                      key={product._id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        border: '1px solid #253049',
                        borderRadius: '7px',
                        backgroundColor: 'var(--card)'
                      }}
                    >
                      {/* Product Image - Small container on left */}
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
                      
                      {/* Product Details - Right side */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                              {product.name}
                            </div>
                            <div style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                              Ksh {product.price.toLocaleString()}
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: 
                                product.status === 'approved' || product.status === 'active' || product.status === 'available' ? '#28a745' :
                                product.status === 'pending' ? '#ffc107' :
                                product.status === 'rejected' ? '#dc3545' :
                                product.status === 'sold' ? '#17a2b8' : '#6c757d',
                              color: 
                                product.status === 'pending' ? '#000' : '#fff',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {product.status === 'approved' || product.status === 'available' ? '✅ Approved' :
                               product.status === 'pending' ? '⏳ Pending' :
                               product.status === 'rejected' ? '❌ Rejected' :
                               product.status === 'sold' ? '💰 Sold' :
                               product.status}
                            </span>
                            
                            {/* Live on Website Notification for Approved Products */}
                            {(product.status === 'approved' || product.status === 'available') && (
                              <span style={{
                                padding: '2px 6px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                animation: 'pulse 2s infinite'
                              }}>
                                🌐 Live on Website
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div style={{ flex: 1 }} />
                        
                        {/* Rejection Reason for Rejected Products */}
                        {product.status === 'rejected' && product.rejectionReason && (
                          <div style={{
                            marginTop: '2px',
                            display: 'flex',
                            justifyContent: 'flex-end'
                          }}>
                            <div style={{
                              padding: '3px 6px',
                              backgroundColor: '#f8d7da',
                              border: '1px solid #f5c6cb',
                              borderRadius: '2px',
                              borderLeft: '2px solid #dc3545',
                              maxWidth: '70%',
                              width: 'fit-content'
                            }}>
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#721c24',
                                lineHeight: '1.2',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span style={{ fontWeight: '600' }}>❌ Rejection Reason:</span>
                                <span>{product.rejectionReason}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Bottom row with date and actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                            Listed: {new Date(product.createdAt).toLocaleDateString()}
                          </div>
                          
                          {/* Action buttons for sold products */}
                          {product.status === 'sold' && !product.withdrawalRequested && (
                            <button
                              onClick={() => requestWithdrawal(product._id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              💸 Request Withdrawal
                            </button>
                          )}
                          
                          {product.withdrawalRequested && (
                            <span style={{
                              padding: '4px 8px',
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}>
                              🔄 Withdrawal Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Account Management</h3>
              <p className="meta" style={{ margin: '0 0 20px 0', fontSize: 14, lineHeight: 1.5, color: '#666' }}>
                Manage your personal information, password, and delivery address.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gap: '24px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))'
              }}>
                {/* User Information Card */}
                <div style={{
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '24px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
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
                      
                      <div style={{ display: 'grid', gap: '12px' }}>
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
                        onClick={() => document.getElementById('profilePicture').click()}
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
                          id="profilePicture"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        <small style={{ color: '#666' }}>Click to change photo</small>
                      </div>

                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            placeholder="Enter your email"
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px'
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
                            onClick={handleProfileUpdate}
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

                  {/* Password Management Section */}
                  <div style={{ 
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid #eee'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                        🔒 Password
                      </h5>
                      {!changingPassword && (
                        <button
                          onClick={() => setChangingPassword(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🔑 Change Password
                        </button>
                      )}
                    </div>

                    {!changingPassword ? (
                      <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Password last changed: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Current Password *
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '8px 40px 8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              {showPassword.current ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            New Password *
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '8px 40px 8px 12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              {showPassword.new ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {passwordData.newPassword && (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                fontSize: '12px'
                              }}>
                                <span>Strength:</span>
                                <span style={{ 
                                  color: getPasswordStrength(passwordData.newPassword).color,
                                  fontWeight: 'bold'
                                }}>
                                  {getPasswordStrength(passwordData.newPassword).text}
                                </span>
                                <div style={{
                                  width: '60px',
                                  height: '4px',
                                  backgroundColor: '#e9ecef',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${(getPasswordStrength(passwordData.newPassword).score / 5) * 100}%`,
                                    height: '100%',
                                    backgroundColor: getPasswordStrength(passwordData.newPassword).color,
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Confirm New Password *
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '8px 40px 8px 12px',
                                border: `1px solid ${passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? '#dc3545' : '#ddd'}`,
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              {showPassword.confirm ? '🙈' : '👁️'}
                            </button>
                          </div>
                          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                              Passwords do not match
                            </div>
                          )}
                        </div>

                        {passwordErrors.general && (
                          <div style={{ color: '#dc3545', fontSize: '14px' }}>
                            {passwordErrors.general}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={handlePasswordChange}
                            disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: passwordLoading ? 'not-allowed' : 'pointer',
                              fontSize: '14px',
                              opacity: passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword ? 0.6 : 1
                            }}
                          >
                            {passwordLoading ? 'Changing...' : '🔒 Change Password'}
                          </button>
                          <button
                            onClick={() => {
                              setChangingPassword(false)
                              setPasswordErrors({})
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
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

                {/* Delivery Address Card */}
                <div style={{
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '24px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
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
                        <div style={{ display: 'grid', gap: '12px' }}>
                          <div><strong>Full Name:</strong> {addressData.fullName}</div>
                          <div><strong>Phone:</strong> {addressData.phone}</div>
                          <div><strong>Address:</strong> {addressData.street}</div>
                          <div><strong>City:</strong> {addressData.city}</div>
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
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={addressFormData.fullName}
                          onChange={(e) => setAddressFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          placeholder="Enter full name for delivery"
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={addressFormData.phone}
                          onChange={(e) => setAddressFormData(prev => ({ ...prev, phone: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          placeholder="0712345678"
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={addressFormData.street}
                          onChange={(e) => setAddressFormData(prev => ({ ...prev, street: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          placeholder="Enter street address"
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            City/Town *
                          </label>
                          <input
                            type="text"
                            value={addressFormData.city}
                            onChange={(e) => setAddressFormData(prev => ({ ...prev, city: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            placeholder="City"
                          />
                        </div>
                        
                        <div>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                            Region/County *
                          </label>
                          <input
                            type="text"
                            value={addressFormData.region}
                            onChange={(e) => setAddressFormData(prev => ({ ...prev, region: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            placeholder="Region"
                          />
                        </div>
                      </div>
                      
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                          Additional Instructions
                        </label>
                        <textarea
                          value={addressFormData.additionalInstructions}
                          onChange={(e) => setAddressFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '60px',
                            resize: 'vertical'
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
                          onClick={handleAddressUpdate}
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
        </div>
    </main>
  )
}
