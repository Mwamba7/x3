'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductForm({ initial, section = 'collection', backUrl = '/okero/products' }) {
  const router = useRouter()
  const isEdit = Boolean(initial?.id)
  
  // Debug: Log initial data to see what's loaded from database
  console.log('🔍 AdminProductForm - Initial data:', initial)
  console.log('🔍 AdminProductForm - Initial deliveryFees:', initial?.deliveryFees)
  console.log('🔍 AdminProductForm - Section:', section)
  
  // Debug: Track currentImages initialization in detail
  console.log('🔍 AdminProductForm - Deep dive into initial images:', {
    'initial?.images': initial?.images,
    'initial?.imagesJson': initial?.imagesJson,
    'typeof initial?.images': typeof initial?.images,
    'isArray': Array.isArray(initial?.images),
    'length': initial?.images?.length,
    'initialImages content': initial?.images?.map((img, idx) => ({
      idx,
      content: img,
      type: typeof img,
      isEmpty: !img,
      isBlank: img?.trim() === '',
      isNull: img === null,
      isUndefined: img === undefined,
      isStringNull: img === 'null',
      isStringUndefined: img === 'undefined',
      isDataUrl: img?.startsWith?.('data:'),
      length: img?.length
    }))
  })
  
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || '',
    price: initial?.price?.toString() || '',
    img: initial?.img || '',
    images: '',
    meta: initial?.meta || '',
    condition: initial?.condition || '',
    status: initial?.status || 'available',
    adminContact: initial?.adminContact || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [categories, setCategories] = useState([])
  const [imageList, setImageList] = useState([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [failedImages, setFailedImages] = useState(new Set())
  const [currentImages, setCurrentImages] = useState(() => {
    const initialImages = Array.isArray(initial?.images) ? [...initial.images] : []
    
    console.log('🔍 AdminProductForm - currentImages initialization:', {
      'initialImages raw': initialImages,
      'initialImages length': initialImages.length
    })
    
    // AGGRESSIVE FILTERING - Remove any possible blank images
    const filteredImages = initialImages.filter((img, idx) => {
      // Multiple layers of validation
      if (img === null || img === undefined) {
        console.log(`🔍 Filtering out null/undefined image at index ${idx}`)
        return false
      }
      
      if (typeof img !== 'string') {
        console.log(`🔍 Filtering out non-string image at index ${idx}:`, typeof img)
        return false
      }
      
      if (img.trim() === '') {
        console.log(`🔍 Filtering out empty string image at index ${idx}`)
        return false
      }
      
      if (img === 'null' || img === 'undefined') {
        console.log(`🔍 Filtering out string null/undefined image at index ${idx}`)
        return false
      }
      
      if (img.includes('data:,')) {
        console.log(`🔍 Filtering out empty data URL image at index ${idx}`)
        return false
      }
      
      if (img.length < 5) {
        console.log(`🔍 Filtering out too short image at index ${idx}:`, img.length)
        return false
      }
      
      // Image passed all filters
      console.log(`✅ Keeping valid image at index ${idx}:`, img.substring(0, 50) + (img.length > 50 ? '...' : ''))
      return true
    })
    
    console.log('🔍 AdminProductForm - currentImages initialization result:', {
      initialImages,
      filteredImages,
      imagesCount: filteredImages.length,
      filteredOut: initialImages.length - filteredImages.length
    })
    
    return filteredImages
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Function to validate if a string is a valid image URL or base64
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    
    // Check if it's a base64 image
    if (url.startsWith('data:image/')) return true
    
    // Check if it's a valid URL with common image extensions
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.toLowerCase()
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(pathname)
      
      // Allow URLs that either have image extensions or are from common image hosting services
      if (hasImageExtension || 
          urlObj.hostname.includes('imgur') || 
          urlObj.hostname.includes('cloudinary') || 
          urlObj.hostname.includes('unsplash') ||
          urlObj.hostname.includes('pexels') ||
          urlObj.hostname.includes('amazonaws') ||
          urlObj.hostname.includes('googleusercontent') ||
          urlObj.hostname.includes('github') ||
          pathname.includes('/image') ||
          pathname.includes('/photo')) {
        return true
      }
      
      // For other URLs, we'll validate them when they're actually loaded
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (isEdit) return // do not change categories list on edit; category is locked
    
    // Define categories by section
    const sectionCategories = {
      collection: [
        { key: 'tv', label: 'Televisions' },
        { key: 'radio', label: 'Sound systems' },
        { key: 'phone', label: 'Mobile phones' },
        { key: 'electronics', label: 'Electronics' },
        { key: 'accessory', label: 'Accessories' },
        { key: 'appliances', label: 'Appliances' },
        { key: 'fridge', label: 'Refrigerators' },
        { key: 'cooler', label: 'Coolers' },
      ],
      preowned: [
        { key: 'preowned-electronics', label: 'Pre-owned Electronics' },
        { key: 'preowned-fashion', label: 'Pre-owned Fashion' },
        { key: 'preowned-appliances', label: 'Pre-owned Appliances' },
        { key: 'preowned-furniture', label: 'Pre-owned Furniture' },
        { key: 'preowned-other', label: 'Other Pre-owned Items' },
      ],
      marketplace: [
        { key: 'electronics', label: 'Electronics' },
        { key: 'fashion', label: 'Fashion' },
        { key: 'appliances', label: 'Appliances' },
        { key: 'furniture', label: 'Furniture' },
        { key: 'books', label: 'Books' },
        { key: 'sports', label: 'Sports & Outdoors' },
        { key: 'toys', label: 'Toys & Games' },
        { key: 'accessories', label: 'Accessories' },
        { key: 'other', label: 'Other Items' },
      ]
    }
    
    const fallbackCategories = sectionCategories[section] || sectionCategories.collection
    
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        
        // Filter categories based on section
        let allowedCategories = []
        if (section === 'collection') {
          allowedCategories = ['tv','radio','phone','electronics','accessory','appliances','fridge','cooler']
        } else if (section === 'preowned') {
          allowedCategories = ['preowned-electronics','preowned-fashion','preowned-appliances','preowned-furniture','preowned-other']
        } else if (section === 'marketplace') {
          allowedCategories = ['electronics','fashion','appliances','furniture','books','sports','toys','accessories','other']
        }
        
        const filtered = arr.filter(c => allowedCategories.includes(c.key))
        setCategories(filtered.length ? filtered : fallbackCategories)
      })
      .catch(() => setCategories(fallbackCategories))
  }, [initial?.category, form.category, isEdit, section])

  function bind(k) {
    return {
      value: form[k],
      onChange: (e) => {
        setForm((s) => ({ ...s, [k]: e.target.value }))
        // If editing the images field, sync with imageList
        if (k === 'images') {
          const urls = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          console.log('🔍 AdminProductForm - Form images field sync:', {
            fieldName: 'images',
            rawValue: e.target.value,
            splitResult: e.target.value.split(','),
            trimmedUrls: e.target.value.split(',').map(s => s.trim()),
            filteredUrls: urls,
            imageListBefore: imageList,
            imageListAfter: urls
          })
          setImageList(urls)
        }
      }
    }
  }

  // Sync comma-separated field when imageList changes
  useEffect(() => {
    const csv = imageList.join(', ')
    if (form.images !== csv) {
      setForm(s => ({ ...s, images: csv }))
    }
  }, [imageList, form.images])

  // Monitor currentImages and prevent blank images from being added
  useEffect(() => {
    const blankImages = currentImages.filter((img, idx) => {
      const isBlank = !img || 
                     typeof img !== 'string' || 
                     img.trim() === '' || 
                     img === 'null' || 
                     img === 'undefined' || 
                     img.includes('data:,') || 
                     img.length < 5
      
      if (isBlank) {
        console.log(`🚨 MONITOR - Found blank image at index ${idx}:`, img)
      }
      
      return isBlank
    })
    
    if (blankImages.length > 0) {
      console.log(`🚨 MONITOR - Detected ${blankImages.length} blank images, removing them...`)
      setCurrentImages(prev => prev.filter((img, idx) => {
        const isBlank = !img || 
                       typeof img !== 'string' || 
                       img.trim() === '' || 
                       img === 'null' || 
                       img === 'undefined' || 
                       img.includes('data:,') || 
                       img.length < 5
        
        if (!isBlank) {
          console.log(`✅ MONITOR - Keeping valid image at index ${idx}:`, img.substring(0, 50) + (img.length > 50 ? '...' : ''))
        }
        
        return !isBlank
      }))
    }
  }, [currentImages.length]) // Only check when length changes

  function addImage() {
    const url = newImageUrl.trim()
    if (url && isValidImageUrl(url)) {
      setImageList(list => [...list, url])
      setNewImageUrl('')
    } else if (url) {
      alert('Please enter a valid image URL or base64 data')
    }
  }

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== files.length) {
      alert('Please select only image files (JPG, PNG, GIF, etc.)')
      return
    }
    
    if (imageFiles.length > 5) {
      alert('Please select maximum 5 images at a time')
      return
    }
    
    setSelectedFiles(imageFiles)
  }

  // Upload selected files
  const uploadSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files first')
      return
    }

    setUploadingFiles(true)
    try {
      const base64Images = []
      
      console.log('📤 Upload Debug - Starting upload:', {
        selectedFiles: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type }))
      })
      
      for (const file of selectedFiles) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`)
          continue
        }
        
        console.log(`📤 Processing file: ${file.name}`)
        const base64 = await fileToBase64(file)
        
        // Check base64 size (should be reasonable)
        if (base64.length > 10 * 1024 * 1024) { // 10MB base64 limit
          console.warn(`⚠️ Base64 for ${file.name} is very large: ${base64.length} characters`)
          alert(`File ${file.name} produces too large base64 data. Please choose a smaller image.`)
          continue
        }
        
        base64Images.push(base64)
        console.log(`✅ Successfully processed ${file.name}, base64 length: ${base64.length}`)
      }
      
      console.log('📤 Upload Debug - Processed images:', {
        totalFiles: selectedFiles.length,
        successfulImages: base64Images.length,
        totalBase64Size: base64Images.reduce((sum, img) => sum + img.length, 0)
      })
      
      // Add to image list
      setImageList(list => {
        const newList = [...list, ...base64Images]
        console.log('📤 Upload Debug - Updated imageList:', {
          oldCount: list.length,
          newCount: newList.length,
          addedImages: base64Images.length
        })
        return newList
      })
      
      // If no cover image is set and we have uploaded images, set the first one as cover
      if (!form.img && base64Images.length > 0) {
        setForm(s => {
          console.log('📤 Upload Debug - Setting cover image to first uploaded image')
          return { ...s, img: base64Images[0] }
        })
      }
      
      setSelectedFiles([])
      
      // Clear file input
      const fileInput = document.getElementById('imageFileInput')
      if (fileInput) fileInput.value = ''
      
      alert(`Successfully uploaded ${base64Images.length} image(s)!`)
      
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files. Please try again.')
    } finally {
      setUploadingFiles(false)
    }
  }

  // Select cover image from gallery
  const selectAsCoverImage = (imageUrl) => {
    setForm(s => ({ ...s, img: imageUrl }))
  }

  function updateImageAt(i, url) {
    setImageList(list => list.map((v, idx) => idx === i ? url.trim() : v).filter(url => url && url.trim()))
  }

  function removeImage(i) {
    setImageList(list => list.filter((_, idx) => idx !== i))
  }

  function removeCurrentImage(i) {
    setCurrentImages(list => list.filter((_, idx) => idx !== i))
  }

  function cleanupImages() {
    setImageList(list => list.filter(url => {
      if (!url || typeof url !== 'string') return false
      
      // Remove images that have actually failed to load
      if (failedImages.has(url)) return false
      
      // Keep base64 images
      if (url.startsWith('data:image/')) return true
      
      // Keep URLs that look like valid URLs
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }))
    
    // Clear failed images that were removed
    setFailedImages(prev => {
      const newSet = new Set()
      imageList.forEach(url => {
        if (prev.has(url)) newSet.add(url)
      })
      return newSet
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // SAFEGUARD: Prevent moving marketplace/preowned products to other sections
    if (isEdit && initial) {
      const currentSection = initial.section
      const targetSection = section
      
      // Check if product is currently in marketplace or preowned
      if (currentSection === 'marketplace' || currentSection === 'preowned') {
        if (currentSection !== targetSection) {
          setError(`Cannot move product from ${currentSection} to ${targetSection}. Products in marketplace or preowned sections cannot be moved to other sections.`)
          setLoading(false)
          return
        }
      }
      
      // Check if product has marketplace metadata
      if (initial.metadata && 
          (initial.metadata.source === 'sell-page' || 
           initial.metadata.submissionType === 'public')) {
        if (currentSection !== 'marketplace') {
          setError('Cannot modify marketplace products. Products uploaded through the marketplace page cannot be moved to other sections.')
          setLoading(false)
          return
        }
      }
    }
    
    try {
      // Debug: Check all image sources before processing
      console.log('🔍 AdminProductForm - Save process - All image sources:', {
        'form.images': form.images,
        'form.images.trim()': form.images.trim(),
        'imageList': imageList,
        'currentImages': currentImages,
        'initial.images': initial?.images
      })
      
      // Use currentImages as the primary source - it contains all uploaded images
      const validCurrentImages = currentImages.filter((img, idx) => {
        if (img === null || img === undefined) {
          console.log(`🔧 SAVE - Filtering out null/undefined image at index ${idx}`)
          return false
        }
        
        if (typeof img !== 'string') {
          console.log(`� SAVE - Filtering out non-string image at index ${idx}:`, typeof img)
          return false
        }
        
        if (img.trim() === '') {
          console.log(`🔧 SAVE - Filtering out empty string image at index ${idx}`)
          return false
        }
        
        if (img === 'null' || img === 'undefined') {
          console.log(`🔧 SAVE - Filtering out string null/undefined image at index ${idx}`)
          return false
        }
        
        if (img.includes('data:,')) {
          console.log(`🔧 SAVE - Filtering out empty data URL image at index ${idx}`)
          return false
        }
        
        if (img.length < 5) {
          console.log(`🔧 SAVE - Filtering out too short image at index ${idx}:`, img.length)
          return false
        }
        
        console.log(`🔧 SAVE - Keeping valid image at index ${idx}:`, img.substring(0, 50) + (img.length > 50 ? '...' : ''))
        return true
      })
      
      console.log('🔍 AdminProductForm - Using currentImages as primary source:', {
        currentImages,
        validCurrentImages,
        validCurrentImagesLength: validCurrentImages.length,
        filteredOut: currentImages.length - validCurrentImages.length
      })
      
      // Set the final images to save
      const finalImages = validCurrentImages
      
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        section: section, // Add section to payload
        price: Number(form.price),
        img: form.img.trim(),
        meta: form.meta,
        condition: form.condition,
        status: form.status,
        adminContact: form.adminContact.trim(),
        // Use the filtered currentImages
        images: finalImages,
        imagesJson: JSON.stringify(finalImages)
      }
      
      console.log('� Final payload with images:', payload)
      console.log('� Final images count:', finalImages.length)
      
      // Debug: Log what we're saving
      console.log('AdminProductForm saving:', {
        productName: form.name,
        currentImages,
        finalImages: payload.images,
        finalImagesLength: finalImages.length,
        isEdit,
        payload
      })
      let res, data
      if (isEdit) {
        // For editing, use the general products endpoint
        res = await fetch(`/api/products/${initial.id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            // Add authentication headers to prevent login redirect
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(payload)
        })
        
        // Check if response is HTML (login page) instead of JSON
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Authentication required. Please log in again.')
        }
        
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
      } else {
        // Creating new product - use section-specific endpoint
        const apiEndpoint = section === 'collection' ? '/api/products/collection' :
                           section === 'preowned' ? '/api/products/preowned' :
                           section === 'marketplace' ? '/api/products/marketplace' :
                           '/api/products'
        
        res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            // Add authentication headers to prevent login redirect
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(payload)
        })
        
        // Check if response is HTML (login page) instead of JSON
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Authentication required. Please log in again.')
        }
        
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Create failed')
      }
      router.push(backUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onDelete() {
    if (!confirm('Are you sure you want to delete this product?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${initial.id}`, { 
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include' // Include cookies for authentication
      })
      
      // Check if response is HTML (login page) instead of JSON
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      router.push(backUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="sell-form" style={{ display: 'grid', gap: 20, fontSize: '16px' }}>
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div>
          <label className="form-label" htmlFor="name">Name</label>
          <input className="form-control" id="name" placeholder="Product name" {...bind('name')} required />
        </div>
        <div>
          <label className="form-label" htmlFor="category">Category</label>
          {isEdit ? (
            <input className="form-control" id="category" value={form.category} readOnly disabled title="Category cannot be changed when editing" />
          ) : (
            <select className="form-control" id="category" value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))} required>
              <option value="">Select category…</option>
              {categories.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        <div>
          <label className="form-label" htmlFor="price">Price (Ksh)</label>
          <input className="form-control" id="price" type="number" min="0" step="1" placeholder="e.g. 45000" {...bind('price')} required />
        </div>
        <div>
          <label className="form-label" htmlFor="status">Status</label>
          <select className="form-control" id="status" {...bind('status')}>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        <div>
          <label className="form-label" htmlFor="adminContact">Contact Number</label>
          <input 
            className="form-control" 
            id="adminContact" 
            type="tel" 
            placeholder="e.g. +254718176584" 
            {...bind('adminContact')} 
          />
          <div style={{ 
            fontSize: '12px', 
            color: '#9ca3af', 
            marginTop: '4px',
            fontStyle: 'italic' 
          }}>
            💡 Contact number for inquiries about this product (WhatsApp/call)
          </div>
        </div>
        <div>
          <label className="form-label" htmlFor="condition">Condition</label>
          <input className="form-control" id="condition" placeholder="e.g. New, Refurbished" {...bind('condition')} />
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="img">Cover Image</label>
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Current cover image preview */}
          {form.img && (
            <div style={{ 
              padding: '12px',
              backgroundColor: '#1a2332',
              borderRadius: '8px',
              border: '2px solid #4ade80'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '8px'
              }}>
                <img 
                  src={form.img} 
                  alt="Cover preview" 
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    objectFit: 'cover', 
                    borderRadius: '6px',
                    border: '2px solid #4ade80'
                  }}
                />
                <div>
                  <div style={{ color: '#4ade80', fontWeight: '600', fontSize: '14px' }}>
                    ✅ Current Cover Image
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    This image will be used as the main product photo
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gallery selector - show if we have uploaded images */}
          {(imageList.length > 0 || currentImages.length > 0) && (
            <div style={{ 
              padding: '12px',
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #374151'
            }}>
              <div style={{ 
                marginBottom: '8px',
                fontWeight: '600',
                color: '#e5e7eb',
                fontSize: '14px'
              }}>
                🖼️ Choose Cover from Gallery
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                gap: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {/* Current images */}
                {(() => {
                  const filteredGalleryImages = currentImages.filter((src) => {
                    // Aggressive filtering for gallery display
                    if (!src) return false
                    if (typeof src !== 'string') return false
                    if (src.trim() === '') return false
                    if (src === 'null' || src === 'undefined') return false
                    if (src.includes('data:,')) return false
                    if (src.length < 5) return false // Too short to be a valid image URL
                    return true
                  })
                  
                  console.log('🖼️ Gallery Debug - Current Images:', {
                    currentImages,
                    filteredGalleryImages,
                    galleryCount: filteredGalleryImages.length
                  })
                  
                  // Only render gallery section if there are valid images
                  if (filteredGalleryImages.length === 0) {
                    return null // Don't render gallery at all if no valid images
                  }
                  
                  return filteredGalleryImages.map((src, i) => (
                  <div 
                    key={`current-${i}`}
                    onClick={() => selectAsCoverImage(src)}
                    style={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      border: form.img === src ? '3px solid #4ade80' : '2px solid #374151',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      transition: 'all 0.2s ease'
                    }}
                    title="Click to set as cover image"
                  >
                    <img 
                      src={src} 
                      alt={`Gallery ${i + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                    {form.img === src && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#4ade80',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                  ))
                })()}
                {/* New uploaded images */}
                {imageList.map((src, i) => (
                  <div 
                    key={`new-${i}`}
                    onClick={() => selectAsCoverImage(src)}
                    style={{ 
                      position: 'relative',
                      cursor: 'pointer',
                      border: form.img === src ? '3px solid #4ade80' : '2px solid #374151',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      transition: 'all 0.2s ease'
                    }}
                    title="Click to set as cover image"
                  >
                    <img 
                      src={src} 
                      alt={`New ${i + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                    {form.img === src && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#4ade80',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ 
                marginTop: '8px',
                fontSize: '12px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                💡 Click any image above to set it as the cover photo
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Show existing images with delete options */}
      {isEdit && currentImages.length > 0 && (
        <fieldset style={{ 
          border: '1px solid #374151', 
          borderRadius: '8px', 
          padding: '16px', 
          margin: '16px 0',
          backgroundColor: '#1a1a1a'
        }}>
          <legend style={{ 
            padding: '0 8px', 
            fontWeight: '600', 
            color: '#9ca3af' 
          }}>
            📋 Current Product Images
          </legend>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            {(() => {
              const filteredCurrentImages = currentImages.filter((src) => {
                // Aggressive filtering for current images display
                if (!src) return false
                if (typeof src !== 'string') return false
                if (src.trim() === '') return false
                if (src === 'null' || src === 'undefined') return false
                if (src.includes('data:,')) return false
                if (src.length < 5) return false // Too short to be a valid image URL
                return true
              })
              
              console.log('📋 Current Images Debug:', {
                currentImages,
                filteredCurrentImages,
                currentImagesCount: filteredCurrentImages.length
              })
              
              // Only render section if there are valid images
              if (filteredCurrentImages.length === 0) {
                return (
                  <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                    ℹ️ No product images available.
                  </div>
                )
              }
              
              return filteredCurrentImages
            })().map((src, originalIndex) => {
              return (
              <div key={originalIndex} style={{ 
                border: '1px solid #374151', 
                borderRadius: '8px', 
                overflow: 'hidden',
                backgroundColor: '#0f172a',
                position: 'relative'
              }}>
                <div style={{ 
                  height: '100px', 
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={src} 
                    alt={`Current image ${originalIndex + 1}`} 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
                <div style={{ 
                  padding: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: '11px', 
                    color: '#9ca3af',
                    fontWeight: '500'
                  }}>
                    Image {originalIndex + 1}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => removeCurrentImage(originalIndex)}
                    style={{ 
                      fontSize: '11px',
                      padding: '3px 6px',
                      border: '1px solid #dc2626', 
                      color: '#ef4444',
                      backgroundColor: 'transparent',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Delete this image"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              )
            })}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            fontStyle: 'italic'
          }}>
            ℹ️ Click "Delete" to remove specific images. Remaining images will be preserved.
          </div>
        </fieldset>
      )}

      {/* Product Images Upload Section */}
      <fieldset style={{ 
        border: '1px solid #253049', 
        borderRadius: '8px', 
        padding: '16px', 
        margin: '16px 0' 
      }}>
        <legend style={{ 
          padding: '0 8px', 
          fontWeight: '600', 
          color: '#e5e7eb' 
        }}>
          📸 Product Images
        </legend>
        
        {/* Simple Image Upload */}
        <div style={{ 
          padding: '16px',
          backgroundColor: '#1a2332',
          borderRadius: '8px',
          border: '2px dashed #374151',
          marginBottom: '16px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="simpleImageInput" style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#e5e7eb'
            }}>
              📁 Upload Images
            </label>
            <input 
              id="simpleImageInput"
              type="file" 
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length === 0) return
                
                console.log('📤 Simple Upload - Processing files:', files.map(f => ({ name: f.name, size: f.size })))
                
                const base64Images = []
                for (const file of files) {
                  if (file.size > 5 * 1024 * 1024) {
                    alert(`File ${file.name} is too large. Maximum size is 5MB.`)
                    continue
                  }
                  
                  const base64 = await fileToBase64(file)
                  base64Images.push(base64)
                }
                
                if (base64Images.length > 0) {
                  // Add directly to currentImages - no intermediate imageList
                  setCurrentImages(prev => {
                    const newImages = [...prev, ...base64Images]
                    console.log('📤 Simple Upload - Added to currentImages:', {
                      previousCount: prev.length,
                      addedCount: base64Images.length,
                      totalCount: newImages.length
                    })
                    return newImages
                  })
                  
                  // Clear file input
                  e.target.value = ''
                  alert(`Successfully uploaded ${base64Images.length} image(s)!`)
                }
              }}
              style={{ 
                width: '100%',
                padding: '8px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '4px',
                color: '#e5e7eb'
              }}
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginTop: '4px' 
            }}>
              📋 Supported formats: JPG, PNG, GIF, WebP • Max size: 5MB per image
            </div>
          </div>
          
          {/* Save Images Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '12px' 
          }}>
            <button 
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                if (!isEdit) {
                  alert('Please save the product first before saving images.')
                  return
                }
                
                try {
                  setLoading(true)
                  setError('')
                  
                  console.log('💾 Saving images to database...')
                  console.log('💾 Current images to save:', currentImages)
                  
                  // Filter images before saving
                  const validImages = currentImages.filter((img, idx) => {
                    const isValid = img && 
                                   typeof img === 'string' && 
                                   img.trim() !== '' && 
                                   img !== 'null' && 
                                   img !== 'undefined' &&
                                   !img.includes('data:,') &&
                                   img.length >= 5
                    
                    if (!isValid) {
                      console.log(`💾 Filtering out invalid image at index ${idx}:`, img)
                    }
                    
                    return isValid
                  })
                  
                  console.log('💾 Valid images to save:', validImages)
                  
                  const payload = {
                    images: validImages,
                    imagesJson: JSON.stringify(validImages)
                  }
                  
                  const res = await fetch(`/api/products/${initial.id}`, {
                    method: 'PATCH',
                    headers: { 
                      'Content-Type': 'application/json',
                      'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                  })
                  
                  // Check if response is HTML (login page) instead of JSON
                  const contentType = res.headers.get('content-type')
                  if (contentType && contentType.includes('text/html')) {
                    throw new Error('Authentication required. Please log in again.')
                  }
                  
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Failed to save images')
                  
                  console.log('✅ Images saved successfully:', data)
                  alert(`Successfully saved ${validImages.length} image(s) to database!`)
                  
                } catch (error) {
                  console.error('❌ Error saving images:', error)
                  setError(error.message)
                  alert('Error saving images: ' + error.message)
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading || currentImages.length === 0}
              style={{ 
                padding: '8px 16px',
                fontSize: '14px'
              }}
            >
              {loading ? '💾 Saving...' : '💾 Save Images to Database'}
            </button>
          </div>
        </div>
      </fieldset>

      {/* Meta / Specs Section */}
      <fieldset style={{ 
        border: '1px solid #253049', 
        borderRadius: '8px', 
        padding: '16px', 
        margin: '16px 0' 
      }}>
        <legend style={{ 
          padding: '0 8px', 
          fontWeight: '600', 
          color: '#e5e7eb' 
        }}>
          Meta / Specs
        </legend>
        <div>
          <textarea 
            className="form-control" 
            rows={4} 
            placeholder="Product specifications, features, or details..."
            {...bind('meta')} 
          />
        </div>
      </fieldset>

      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#5a2a2a', 
          border: '1px solid #f87171', 
          borderRadius: '6px', 
          color: '#f87171',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        flexWrap: 'wrap', 
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #253049',
        marginTop: '20px'
      }}>
        <button 
          className="btn btn-primary" 
          type="submit" 
          disabled={loading}
          style={{ 
            minWidth: '120px',
            padding: '8px 16px',
            fontSize: '14px',
            position: 'relative'
          }}
        >
          {loading ? (
            <>
              <span style={{ opacity: 0.7 }}>⏳</span> Saving…
            </>
          ) : (
            <>
              <span style={{ marginRight: '4px' }}>
                {isEdit ? '✏️' : '➕'}
              </span>
              {isEdit ? 'Update Product' : 'Create Product'}
            </>
          )}
        </button>
        
        <button 
          className="btn" 
          type="button" 
          onClick={() => router.back()} 
          disabled={loading}
          style={{ minWidth: '100px', padding: '8px 16px', fontSize: '14px' }}
        >
          Cancel
        </button>
        
        {isEdit && (
          <button 
            className="btn" 
            type="button" 
            onClick={onDelete} 
            disabled={loading} 
            style={{ 
              borderColor: '#5a2a2a', 
              color: '#f87171',
              minWidth: '120px',
              padding: '8px 16px',
              fontSize: '14px',
              marginLeft: 'auto'
            }}
            title="Permanently delete this product"
          >
            {loading ? '⏳ Deleting…' : '🗑️ Delete Product'}
          </button>
        )}
      </div>
    </form>
  )
}
