'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

export default function SellForm() {
  const { user, isAuthenticated } = useAuth()
  
  // Debug user data
  useEffect(() => {
    console.log('🔍 SellForm - User data:', user)
    console.log('🔍 SellForm - Is authenticated:', isAuthenticated)
  }, [user, isAuthenticated])
  
  // Seller details are now taken from authenticated user
  // No need for manual input fields

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedProduct, setSubmittedProduct] = useState(null)
  const clearTimerRef = useRef(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const countdownRef = useRef(null)
  const [showQuickReviewPopup, setShowQuickReviewPopup] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [submissionTimestamp, setSubmissionTimestamp] = useState(null)
  const [showFormSections, setShowFormSections] = useState(false)
  const [showServiceFeePopup, setShowServiceFeePopup] = useState(false)

  // Clear form function
  function clearForm() {
    // Only clear product details, seller info comes from authenticated user
    setName('')
    setPrice('')
    setSpecs('')
    setFiles([])
    setPreviews([])
    setSubmissionType('')
    setStatus('')
    setErrors({})
    setHasSubmitted(false)
    setSubmittedProduct(null)
    setTimeRemaining(0)
    setShowQuickReviewPopup(false)
    setIsLoaded(true) // Keep isLoaded true to allow saving after clear
    setSubmissionTimestamp(null)
    setShowFormSections(false)
    
    // Clear any existing timers
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
      clearTimerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    
    // Clear localStorage
    localStorage.removeItem('sellFormData')
  }

  // Start auto-clear timer
  function startAutoClearTimer() {
    startAutoClearTimerWithTime(300) // 5 minutes
  }

  // Start auto-clear timer with specific time
  function startAutoClearTimerWithTime(seconds) {
    // Clear any existing timers first
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
    }
    
    // Set initial time remaining
    setTimeRemaining(seconds)
    
    // Start countdown interval (update every second)
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearForm()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Set main timer as backup
    clearTimerRef.current = setTimeout(() => {
      clearForm()
    }, seconds * 1000)
  }

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('sellFormData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        // Only restore product details, not seller info (comes from authenticated user)
        setName(data.name || '')
        setCategory(data.category || 'tv')
        setPrice(data.price || '')
        setSpecs(data.specs || '')
        setSubmissionType(data.submissionType || 'direct_to_admin')
        setHasSubmitted(data.hasSubmitted || false)
        setSubmittedProduct(data.submittedProduct || null)
        setStatus(data.status || '')
        setSubmissionTimestamp(data.submissionTimestamp || null)
        // Don't restore showFormSections from localStorage - always start fresh
        setShowFormSections(false)
        
        // Restore images if they exist
        if (data.savedFiles && data.savedFiles.length > 0) {
          try {
            const restoredFiles = base64ToFiles(data.savedFiles)
            setFiles(restoredFiles)
            
            // Restore previews
            if (data.savedPreviews && data.savedPreviews.length > 0) {
              setPreviews(data.savedPreviews)
            } else {
              // Generate new previews if saved previews are missing
              const newPreviews = restoredFiles.map(file => URL.createObjectURL(file))
              setPreviews(newPreviews)
            }
          } catch (error) {
            console.error('Error restoring images:', error)
          }
        }
        
        // Restart auto-clear timer if form was submitted
        if (data.hasSubmitted && data.submissionTimestamp) {
          const now = Date.now()
          const timePassed = Math.floor((now - data.submissionTimestamp) / 1000)
          const remainingTime = Math.max(0, 300 - timePassed) // 300 seconds = 5 minutes
          
          if (remainingTime > 0) {
            setTimeRemaining(remainingTime)
            startAutoClearTimerWithTime(remainingTime)
          } else {
            // Time has expired, clear the form
            clearForm()
          }
        }
      } catch (error) {
        console.error('Error loading saved form data:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [])

  // Save to localStorage whenever form data changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToLocalStorage()
    }
  }, [name, category, price, specs, submissionType, hasSubmitted, submittedProduct, status, timeRemaining, files, previews, submissionTimestamp, showFormSections, isLoaded])

  // Format countdown time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Convert files to base64 for storage
  async function filesToBase64(fileList) {
    const base64Files = []
    for (const file of fileList) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result
        })
        reader.readAsDataURL(file)
      })
      base64Files.push(base64)
    }
    return base64Files
  }

  // Convert base64 back to files
  function base64ToFiles(base64Files) {
    return base64Files.map(fileData => {
      const byteCharacters = atob(fileData.data.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      return new File([byteArray], fileData.name, { type: fileData.type })
    })
  }

  // Save form data to localStorage
  async function saveToLocalStorage() {
    try {
      // Convert files to base64 for storage
      const base64Files = files.length > 0 ? await filesToBase64(files) : []
      
      const formData = {
        // Seller info comes from authenticated user, no need to save
        name,
        category,
        price,
        specs,
        submissionType,
        hasSubmitted,
        submittedProduct,
        status,
        timeRemaining,
        savedFiles: base64Files,
        savedPreviews: previews,
        submissionTimestamp: submissionTimestamp,
        showFormSections: showFormSections
      }
      localStorage.setItem('sellFormData', JSON.stringify(formData))
    } catch (error) {
      console.error('Error saving form data:', error)
    }
  }

  // Handle Quick Review popup actions
  function handleQuickReviewClick() {
    setShowQuickReviewPopup(false)
    sendToWhatsApp()
  }

  function handlePopupClose() {
    setShowQuickReviewPopup(false)
  }

  async function onFilesChange(e) {
    const picked = Array.from(e.target.files || []).slice(0, 5)
    setFiles(picked)
    const urls = picked.map(f => URL.createObjectURL(f))
    setPreviews(urls)
    
    // Save immediately after file selection
    if (isLoaded) {
      await saveToLocalStorage()
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setStatus('')
    setErrors({})
    setIsSubmitting(true)

    // Basic validation - only validate product details
    const nextErrors = {}
    if (!name.trim()) nextErrors.name = 'Product name is required'
    if (!user?.name) {
      nextErrors.seller = 'User authentication required'
      console.error('User name missing:', user)
    }
    if (!user?.phone) {
      nextErrors.seller = 'User phone number required'
      console.error('User phone missing:', user)
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('name', name)
      formData.append('category', category)
      formData.append('price', price)
      formData.append('description', specs)
      // Use authenticated user data
      formData.append('sellerName', user.name)
      formData.append('sellerPhone', user.phone)
      formData.append('sellerEmail', user.email)
      formData.append('sellerId', user._id || user.id) // Add user ID for database association
      formData.append('submissionType', submissionType)
      
      // Add images
      files.forEach((file, index) => {
        formData.append('images', file)
      })

      // Submit to API
      const response = await fetch('/api/sell/submit', {
        method: 'POST',
        body: formData
      })

      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response ok:', response.ok)

      const result = await response.json()
      console.log('🔍 Response data:', result)

      if (response.ok) {
        setStatus('✅ Product submitted successfully! Admin will review and approve shortly.')
        
        // Set submission timestamp immediately
        const timestamp = Date.now()
        setSubmissionTimestamp(timestamp)
        setHasSubmitted(true)
        
        // Store submitted product data for WhatsApp
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
        
        // Store user tracking info
        const userInfo = {
          phone: user.phone,
          name: user.name,
          email: user.email,
          lastSubmission: timestamp
        }
        localStorage.setItem('userTrackingInfo', JSON.stringify(userInfo))
        
        // Start auto-clear timer (5 minutes)
        startAutoClearTimer()
        
        // Show WhatsApp popup after 2 seconds
        setTimeout(() => {
          setShowQuickReviewPopup(true)
        }, 2000)
        
      } else {
        setStatus(`❌ Error: ${result.error || 'Failed to submit product'}`)
      }
    } catch (error) {
      console.error('Submission error:', error)
      setStatus('❌ Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function sendToWhatsApp() {
    if (!submittedProduct || !user) return
    
    const adminPhone = '+254718176584'
    
    // Get category display name
    const categoryNames = {
      'tv': 'Television',
      'radio': 'Radio', 
      'mobile': 'Mobile Phone',
      'fridge': 'Fridge',
      'gas-cooler': 'Gas Cooler',
      'accessory': 'Accessory',
      'outfits': 'Outfits',
      'hoodies': 'Hoodies',
      'shoes': 'Shoes',
      'sneakers': 'Sneakers',
      'ladies': 'Ladies',
      'men': 'Men',
      'others': 'Others'
    }
    
    const categoryDisplay = categoryNames[submittedProduct.category] || submittedProduct.category
    const submissionTypeDisplay = submittedProduct.submissionType === 'public' ? 'Community Marketplace' : 'Direct to Admin'
    
    const message = `*Product Details:*
📱 *Name:* ${submittedProduct.name || 'Not specified'}
📂 *Category:* ${categoryDisplay}
💰 *Expected Price:* Ksh ${submittedProduct.price || 'Not specified'}
📋 *Submission Type:* ${submissionTypeDisplay}
👤 *Seller:* ${user?.name || 'Not specified'}
📞 *Phone:* ${user?.phone || 'Not specified'}
${submittedProduct.specs ? `📝 *Description:* ${submittedProduct.specs.substring(0, 100)}${submittedProduct.specs.length > 100 ? '...' : ''}` : ''}`
    
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank')
    }
  }

  return (
    <div className="sell-wrap">
      <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 16 }}>
        {/* Submission Type - Moved to top */}
        <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
          <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>🎯 Choose Your Selling Option</legend>
          <div style={{ 
            display: 'grid', 
            gap: 12,
            gridTemplateColumns: '1fr'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              cursor: 'pointer',
              background: submissionType === 'direct_to_admin' ? 'var(--surface)' : 'transparent',
              padding: 12,
              borderRadius: 6,
              border: submissionType === 'direct_to_admin' ? '2px solid #007bff' : '2px solid #e1e8ed',
              transition: 'all 0.3s ease'
            }}>
              <input 
                type="radio" 
                name="submissionType" 
                value="direct_to_admin" 
                checked={submissionType === 'direct_to_admin'} 
                onChange={e => {
                  setSubmissionType(e.target.value)
                  setShowFormSections(false) // Reset form sections when changing submission type
                }} 
                disabled={hasSubmitted}
                style={{ 
                  width: 16, 
                  height: 16
                }}
              />
              <div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: 'var(--text)',
                  marginBottom: 3
                }}>
                  🔒 Sell to Admin
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: 'var(--muted)',
                  lineHeight: 1.3
                }}>
                  Private sale • Direct to admin • Pre-owned section
                </div>
              </div>
            </label>
            
            <label 
              onClick={() => setShowServiceFeePopup(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                cursor: 'pointer',
                background: submissionType === 'public' ? 'var(--surface)' : 'transparent',
                padding: 12,
                borderRadius: 6,
                border: submissionType === 'public' ? '2px solid #007bff' : '2px solid #e1e8ed',
                transition: 'all 0.3s ease'
              }}>
              <input 
                type="radio" 
                name="submissionType" 
                value="public" 
                checked={submissionType === 'public'} 
                onChange={e => {
                  setSubmissionType(e.target.value)
                  setShowFormSections(false) // Reset form sections when changing submission type
                  setShowServiceFeePopup(true) // Show service fee popup for Community Marketplace
                }}
                onClick={() => {
                  setShowServiceFeePopup(true) // Show popup when clicking on Community Marketplace
                }} 
                disabled={hasSubmitted}
                style={{ 
                  width: 16, 
                  height: 16
                }}
              />
              <div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: 'var(--text)',
                  marginBottom: 3
                }}>
                  📢 Community Marketplace
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: 'var(--muted)',
                  lineHeight: 1.3
                }}>
                  Public listing • Visible to all customers • Community features
                </div>
              </div>
            </label>
          </div>
        </fieldset>

        {/* Continue button - shows after submission type is selected */}
        {submissionType && !showFormSections && (
          <div style={{ textAlign: 'right', padding: '12px 0' }}>
            <button
              type="button"
              onClick={() => setShowFormSections(true)}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#218838'
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#28a745'
              }}
            >
              Click to sell your products
            </button>
          </div>
        )}

        {/* Show form sections only after continue button is clicked */}
        {submissionType && showFormSections && (
          <>
            {/* Seller details - Display authenticated user info */}
            <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
              <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>Your Details</legend>
              <div style={{ 
                padding: '12px 16px', 
                backgroundColor: 'transparent', 
                borderRadius: '8px',
                border: '1px solid #6b7280'
              }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: '400' }}>Name:</span>
                    <span style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>{user?.name || 'Loading...'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: '400' }}>Phone:</span>
                    <span style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>{user?.phone || 'Loading...'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: '400' }}>Email:</span>
                    <span style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>{user?.email || 'Loading...'}</span>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '6px 8px', 
                  backgroundColor: 'transparent', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '400' }}>
                    ✅ Account Verified - Products will be linked to your account
                  </span>
                </div>
                {errors.seller && <div style={{ color: '#f2994a', fontSize: 12, marginTop: 4 }}>{errors.seller}</div>}
              </div>
            </fieldset>

            {/* Product details */}
            <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
              <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>Product Details</legend>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', alignItems: 'start' }}>
                <div className="grid-2">
                  <div style={{ width: '100%' }}>
                    <label className="form-label" htmlFor="category">Category</label>
                    <select className="form-control" id="category" value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%' }} disabled={hasSubmitted}>
                      <option value="tv">Television</option>
                      <option value="radio">Radio</option>
                      <option value="phone">Mobile Phone</option>
                      <option value="fridge">Fridge</option>
                      <option value="cooler">Gas Cooler</option>
                      <option value="accessory">Accessory</option>
                      <option value="outfits">Outfits</option>
                      <option value="hoodies">Hoodies</option>
                      <option value="shoes">Shoes</option>
                      <option value="sneakers">Sneakers</option>
                      <option value="ladies">Ladies</option>
                      <option value="men">Men</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div style={{ width: '100%' }}>
                    <label className="form-label" htmlFor="price">Expected Price (Ksh)</label>
                    <input className="form-control" id="price" type="number" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 25000" style={{ width: '100%' }} disabled={hasSubmitted} />
                  </div>
                </div>

                <div>
                  <label className="form-label" htmlFor="name">Product Name</label>
                  <input className="form-control" id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Samsung 55&quot; LED TV" style={{ width: '100%' }} disabled={hasSubmitted} />
                  {errors.name && <div style={{ color: '#f2994a', fontSize: 12, marginTop: 4 }}>{errors.name}</div>}
                </div>

                <div>
                  <label className="form-label" htmlFor="specs">Specs / Description</label>
                  <textarea className="form-control" id="specs" rows={5} value={specs} onChange={e => setSpecs(e.target.value)} placeholder="Key details, condition, storage, accessories, etc." style={{ width: '100%' }} disabled={hasSubmitted} />
                </div>
              </div>
            </fieldset>

            {/* Photos */}
            <fieldset style={{ border: '1px solid #253049', borderRadius: 12, padding: 12 }}>
              <legend style={{ padding: '0 6px', color: 'var(--muted)' }}>Photos</legend>
              <div style={{ display: 'grid', gap: 8 }}>
                <input className="form-control" id="images" type="file" accept="image/*" multiple onChange={onFilesChange} style={{ width: '100%' }} disabled={hasSubmitted} />
                {previews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 10, overflow: 'hidden', border: '1px solid #253049' }}>
                        <img src={src} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    ))}
                  </div>
                )}
                <div className="helper" style={{ fontSize: 14 }}>Upload up to 5 images of your product. High-quality photos help with faster approval.</div>
              </div>
            </fieldset>

            {/* Actions */}
            <div className="form-row" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'column' : 'row', justifyContent: typeof window !== 'undefined' && window.innerWidth <= 768 ? 'flex-start' : 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    className="btn btn-primary" 
                    type="submit" 
                    disabled={isSubmitting || hasSubmitted}
                    style={{ 
                      opacity: (isSubmitting || hasSubmitted) ? 0.7 : 1,
                      padding: '7px 14px',
                      fontSize: 12
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : hasSubmitted ? 'Product in Review' : 'Submit Product for Review'}
                  </button>
                  
                  {hasSubmitted && (
                    <button 
                      type="button"
                      className="btn"
                      onClick={clearForm}
                      style={{ 
                        background: '#f44336',
                        color: 'white',
                        border: '1px solid #f44336',
                        padding: '7px 14px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                      title="Clear form"
                    >
                      {timeRemaining > 0 ? `Clear (${formatTime(timeRemaining)})` : 'Clear'}
                    </button>
                  )}
                </div>
              </div>
              
            </div>
          </>
        )}

        {status && <p className="status">{status}</p>}
      </form>

      {/* Service Fee Popup */}
      {showServiceFeePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e1e8ed'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: 0, 
                fontSize: '18px', 
                color: '#333',
                fontWeight: '600'
              }}>
                💰 Service Fee Information
              </h3>
              <button
                onClick={() => setShowServiceFeePopup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                lineHeight: '1.5', 
                color: '#856404',
                marginBottom: '12px'
              }}>
                <strong>📢 Community Marketplace Fee Structure:</strong>
              </div>
              <ul style={{ 
                margin: '0', 
                paddingLeft: '20px', 
                fontSize: '13px', 
                color: '#856404',
                lineHeight: '1.6'
              }}>
                <li>A <strong>15% service fee</strong> will be deducted from your sale price</li>
                <li>This fee covers platform maintenance, payment processing, and customer support</li>
                <li>You'll receive <strong>85% of your listed price</strong> when your product sells</li>
                <li>Example: If you sell for Ksh 10,000, you'll receive Ksh 8,500</li>
              </ul>
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '20px',
              lineHeight: '1.4'
            }}>
              <strong>Note:</strong> This fee only applies to Community Marketplace listings. Direct admin sales have different terms.
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={() => setShowServiceFeePopup(false)}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Review Popup */}
      {showQuickReviewPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            margin: '20px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: '#333' }}>
              🚀 Speed Up Your Review!
            </h3>
            <p style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.5', color: '#666' }}>
              Your product has been submitted successfully! For faster processing and quicker approval, 
              click the <strong>Quick Review</strong> button to send your details directly to our admin via WhatsApp.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handlePopupClose}
                style={{
                  background: 'transparent',
                  border: '1px solid #ccc',
                  color: '#666',
                  padding: '8px 16px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Maybe Later
              </button>
              <button
                onClick={handleQuickReviewClick}
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: '1px solid #25D366',
                  padding: '8px 16px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📱 Quick Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
