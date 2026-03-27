'use client'
import { useState, useEffect } from 'react'
import { getCurrentUser } from '../lib/userSession'

export default function DatabaseFirstSellForm() {
  // Product details
  const [name, setName] = useState('')
  const [category, setCategory] = useState('tv')
  const [price, setPrice] = useState('')
  const [specs, setSpecs] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [submissionType, setSubmissionType] = useState('direct_to_admin')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedProduct, setSubmittedProduct] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [submissionTimestamp, setSubmissionTimestamp] = useState(null)
  const [showFormSections, setShowFormSections] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Timer refs
  const countdownRef = useRef(null)
  const clearTimerRef = useRef(null)

  useEffect(() => {
    // Load user from session (database-first)
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          setIsLoaded(true)
        } else {
          setStatus('error')
          setErrors({ auth: 'Please log in to submit products' })
        }
      } catch (error) {
        console.error('Error loading user:', error)
        setStatus('error')
        setErrors({ auth: 'Authentication failed' })
      }
    }
    
    loadUser()
  }, [])

  // Auto-clear timer
  useEffect(() => {
    if (hasSubmitted && timeRemaining > 0) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearForm()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [hasSubmitted, timeRemaining])

  // Clear form function
  function clearForm() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    
    // Reset all state (no localStorage)
    setName('')
    setCategory('tv')
    setPrice('')
    setSpecs('')
    setFiles([])
    setPreviews([])
    setSubmissionType('direct_to_admin')
    setStatus('')
    setErrors({})
    setHasSubmitted(false)
    setSubmittedProduct(null)
    setTimeRemaining(300)
    setSubmissionTimestamp(null)
    setShowFormSections(false)
  }

  // Format countdown time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Handle file selection
  async function handleFileSelect(e) {
    const picked = Array.from(e.target.files)
    if (picked.length > 0) {
      setFiles(picked)
      const urls = picked.map(f => URL.createObjectURL(f))
      setPreviews(urls)
    }
  }

  // Form validation
  function validateForm() {
    const newErrors = {}
    
    if (!name.trim()) newErrors.name = 'Product name is required'
    if (!price.trim() || isNaN(price) || Number(price) <= 0) {
      newErrors.price = 'Valid price is required'
    }
    if (!specs.trim()) newErrors.specs = 'Product description is required'
    if (files.length === 0) newErrors.files = 'At least one image is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Form submission
  async function onSubmit(e) {
    e.preventDefault()
    
    if (!user) {
      setErrors({ auth: 'Please log in to submit products' })
      return
    }
    
    if (!validateForm()) return
    
    setLoading(true)
    setStatus('')
    
    try {
      const timestamp = Date.now()
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      formData.append('price', price)
      formData.append('description', specs)
      
      // Use authenticated user data from session
      formData.append('sellerName', user.name)
      formData.append('sellerPhone', user.phone)
      formData.append('sellerEmail', user.email)
      formData.append('sellerId', user._id || user.id)
      
      // Add files
      files.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('submissionType', submissionType)
      formData.append('timestamp', timestamp.toString())
      
      const response = await fetch('/api/submit-product', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Submission failed')
      }
      
      // Success
      setHasSubmitted(true)
      setSubmissionTimestamp(timestamp)
      setStatus('success')
      setSubmittedProduct({
        name,
        category,
        price,
        specs,
        submissionType,
        fullName: user.name,
        phone: user.phone,
        email: user.email
      })
      
      // Start auto-clear timer (5 minutes)
      setTimeRemaining(300)
      
      // Show WhatsApp popup after 2 seconds
      setTimeout(() => {
        setShowFormSections(true)
      }, 2000)
      
    } catch (error) {
      console.error('Submission error:', error)
      setStatus('error')
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  // WhatsApp sharing
  function shareOnWhatsApp() {
    if (!submittedProduct || !user) return
    
    const adminPhone = '254712345678' // Replace with actual admin number
    const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1)
    const submissionTypeDisplay = submissionType === 'direct_to_admin' ? 'Direct to Admin' : 'Community Marketplace'
    
    const message = `🛍️ *New Product Submission*

📦 *Product:* ${submittedProduct.name}
💰 *Expected Price:* Ksh ${submittedProduct.price || 'Not specified'}
📂 *Category:* ${categoryDisplay}
📋 *Submission Type:* ${submissionTypeDisplay}
👤 *Seller:* ${user.name}
📞 *Phone:* ${user.phone}
📝 *Description:* ${submittedProduct.specs.substring(0, 100)}${submittedProduct.specs.length > 100 ? '...' : ''}`
    
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank')
    }
  }

  if (status === 'error' && errors.auth) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Authentication Required</h3>
        <p>{errors.auth}</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="btn"
          style={{ marginTop: '16px' }}
        >
          Log In
        </button>
      </div>
    )
  }

  if (hasSubmitted) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        background: 'var(--card)',
        borderRadius: '8px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3>Product Submitted Successfully!</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
          Your product "{submittedProduct?.name}" has been submitted for review.
        </p>
        
        {timeRemaining > 0 && (
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--muted)',
            marginBottom: '16px'
          }}>
            Form will auto-clear in {formatTime(timeRemaining)}
          </div>
        )}
        
        {showFormSections && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={shareOnWhatsApp}
              className="btn btn-primary"
            >
              Share on WhatsApp
            </button>
            <button 
              onClick={clearForm}
              className="btn"
            >
              Submit Another Product
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* User Info Display */}
      {user && (
        <div style={{ 
          background: 'var(--background-secondary)', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h4>Seller Information</h4>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
      
      {/* Product Details */}
      <fieldset style={{ 
        border: '1px solid var(--border)', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '20px' 
      }}>
        <legend style={{ 
          padding: '0 8px', 
          fontWeight: '600' 
        }}>
          Product Details
        </legend>
        
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Product Name *
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Samsung 55&quot; LED TV" 
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid var(--border)', 
                borderRadius: '4px' 
              }} 
            />
            {errors.name && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.name}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Category *
            </label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid var(--border)', 
                borderRadius: '4px' 
              }}
            >
              <option value="tv">Televisions</option>
              <option value="radio">Sound systems</option>
              <option value="phone">Mobile phones</option>
              <option value="electronics">Electronics</option>
              <option value="accessory">Accessories</option>
              <option value="appliances">Appliances</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Expected Price (Ksh) *
            </label>
            <input 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              placeholder="e.g. 25000" 
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid var(--border)', 
                borderRadius: '4px' 
              }} 
            />
            {errors.price && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.price}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Description * (Key details, condition, storage, accessories, etc.)
            </label>
            <textarea 
              value={specs} 
              onChange={e => setSpecs(e.target.value)} 
              placeholder="Key details, condition, storage, accessories, etc." 
              rows={5}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid var(--border)', 
                borderRadius: '4px',
                resize: 'vertical'
              }} 
            />
            {errors.specs && (
              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.specs}
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* Photos */}
      <fieldset style={{ 
        border: '1px solid var(--border)', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '20px' 
      }}>
        <legend style={{ 
          padding: '0 8px', 
          fontWeight: '600' 
        }}>
          Product Photos *
        </legend>
        
        <div>
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginBottom: '12px' }}
          />
          
          {errors.files && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px' }}>
              {errors.files}
            </div>
          )}
          
          {previews.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
              gap: '8px' 
            }}>
              {previews.map((url, index) => (
                <img 
                  key={index}
                  src={url} 
                  alt={`Preview ${index + 1}`}
                  style={{ 
                    width: '100%', 
                    height: '100px', 
                    objectFit: 'cover', 
                    borderRadius: '4px',
                    border: '1px solid var(--border)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </fieldset>

      {/* Submission Type */}
      <fieldset style={{ 
        border: '1px solid var(--border)', 
        borderRadius: '8px', 
        padding: '16px', 
        marginBottom: '20px' 
      }}>
        <legend style={{ 
          padding: '0 8px', 
          fontWeight: '600' 
        }}>
          Submission Type
        </legend>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="submissionType" 
              value="direct_to_admin"
              checked={submissionType === 'direct_to_admin'}
              onChange={e => setSubmissionType(e.target.value)}
            />
            <span>Direct to Admin (Fast approval)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="radio" 
              name="submissionType" 
              value="community_marketplace"
              checked={submissionType === 'community_marketplace'}
              onChange={e => setSubmissionType(e.target.value)}
            />
            <span>Community Marketplace (Public listing)</span>
          </label>
        </div>
      </fieldset>

      {/* Error Display */}
      {status === 'error' && errors.submit && (
        <div style={{ 
          color: '#ef4444', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {errors.submit}
        </div>
      )}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? '#9ca3af' : 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Submitting...' : 'Submit Product'}
      </button>
    </form>
  )
}
