'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminProductForm({ initial, section = 'products', backUrl = '/admin/products' }) {
  const router = useRouter()
  const isEdit = Boolean(initial?.id)
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || '',
    price: initial?.price?.toString() || '',
    img: initial?.img || '',
    images: '',
    meta: initial?.meta || '',
    condition: initial?.condition || '',
    status: initial?.status || 'available',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [imageList, setImageList] = useState([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [failedImages, setFailedImages] = useState(new Set())
  const [currentImages, setCurrentImages] = useState(() => {
    return Array.isArray(initial?.images) ? [...initial.images] : []
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
    const fallbackFashion = [
      { key: 'outfits', label: 'Outfits' },
      { key: 'hoodie', label: 'Hoodies' },
      { key: 'shoes', label: 'Shoes' },
      { key: 'sneakers', label: 'Sneakers' },
      { key: 'ladies', label: 'Ladies' },
      { key: 'men', label: 'Men' },
    ]
    const fallbackElectronics = [
      { key: 'tv', label: 'Televisions' },
      { key: 'radio', label: 'Sound systems' },
      { key: 'phone', label: 'Mobile phones' },
      { key: 'electronics', label: 'Electronics' },
      { key: 'accessory', label: 'Accessories' },
      { key: 'appliances', label: 'Appliances' },
    ]
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        const fashion = new Set(['outfits','hoodie','shoes','sneakers','ladies','men'])
        const isFashion = fashion.has((initial?.category || form.category || '').toLowerCase())
        const allow = isFashion
          ? fashion
          : new Set(['tv','radio','phone','electronics','accessory','appliances'])
        const filtered = arr.filter(c => allow.has(c.key))
        setCategories(filtered.length ? filtered : (isFashion ? fallbackFashion : fallbackElectronics))
      })
      .catch(() => setCategories([]))
  }, [initial?.category, form.category, isEdit])

  function bind(k) {
    return {
      value: form[k],
      onChange: (e) => {
        setForm((s) => ({ ...s, [k]: e.target.value }))
        // If editing the images field, sync with imageList
        if (k === 'images') {
          const urls = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
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
  }, [imageList])

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
      
      for (const file of selectedFiles) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`)
          continue
        }
        
        const base64 = await fileToBase64(file)
        base64Images.push(base64)
      }
      
      // Add to image list
      setImageList(list => [...list, ...base64Images])
      
      // If no cover image is set and we have uploaded images, set the first one as cover
      if (!form.img && base64Images.length > 0) {
        setForm(s => ({ ...s, img: base64Images[0] }))
      }
      
      setSelectedFiles([])
      
      // Clear file input
      const fileInput = document.getElementById('imageFileInput')
      if (fileInput) fileInput.value = ''
      
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
    setError('')
    setLoading(true)
    try {
      // Combine images from all sources and filter out empty/invalid ones
      const commaImages = form.images.trim() ? 
        form.images.split(',').map(s => s.trim()).filter(url => url && isValidImageUrl(url)) : []
      const galleryImages = imageList.filter(url => url && isValidImageUrl(url))
      const newImages = [...new Set([...commaImages, ...galleryImages])] // Remove duplicates
      
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        img: form.img.trim(),
        meta: form.meta,
        condition: form.condition,
        status: form.status,
      }
      
      // Handle images based on mode and changes
      if (isEdit) {
        // Filter current images to remove any empty/invalid ones and combine with new images
        const validCurrentImages = currentImages.filter(url => url && isValidImageUrl(url))
        const finalImages = [...new Set([...validCurrentImages, ...newImages])] // Remove duplicates
        
        // Always include images field when editing to handle deletions
        payload.images = finalImages
      } else {
        // Creating new product, use new images only
        payload.images = newImages
      }
      
      // Debug: Log what we're saving
      console.log('AdminProductForm saving:', {
        productName: form.name,
        commaImages,
        galleryImages,
        newImages,
        currentImages,
        finalImages: payload.images,
        isEdit,
        payload
      })
      let res, data
      if (isEdit) {
        // When editing, keep category unchanged — do not send it in the PATCH body
        delete payload.category
        res = await fetch(`/api/products/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Update failed')
      } else {
        // Creating new product
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
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
      const res = await fetch(`/api/products/${initial.id}`, { method: 'DELETE' })
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
                {currentImages.map((src, i) => (
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
                ))}
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
            {currentImages.map((src, i) => (
              <div key={i} style={{ 
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
                    alt={`Current image ${i + 1}`} 
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
                    Image {i + 1}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => removeCurrentImage(i)}
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
            ))}
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

      {/* Product Gallery Images */}
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
          📸 {isEdit ? 'Add New Images' : 'Product Gallery Images'}
        </legend>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Add New Images from Files */}
          <div style={{ 
            padding: '16px',
            backgroundColor: '#1a2332',
            borderRadius: '8px',
            border: '2px dashed #374151'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="imageFileInput" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#e5e7eb'
              }}>
                📁 Select Images from Storage
              </label>
              <input 
                id="imageFileInput"
                type="file" 
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ 
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#e5e7eb'
                }}
              />
            </div>
            
            {selectedFiles.length > 0 && (
              <div style={{ 
                marginBottom: '12px',
                padding: '8px',
                backgroundColor: '#065f46',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#10b981'
              }}>
                ✅ Selected {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'}: {selectedFiles.map(f => f.name).join(', ')}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={uploadSelectedFiles}
                disabled={selectedFiles.length === 0 || uploadingFiles}
              >
                {uploadingFiles ? '⏳ Uploading...' : '📤 Upload Selected Images'}
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={cleanupImages}
                title="Remove invalid image URLs"
              >
                🧹 Clean
              </button>
            </div>
          </div>

          {/* Optional: Still allow URL input for advanced users */}
          <details style={{ 
            backgroundColor: '#1f2937',
            borderRadius: '6px',
            padding: '12px'
          }}>
            <summary style={{ 
              cursor: 'pointer',
              fontWeight: '600',
              color: '#9ca3af',
              marginBottom: '8px'
            }}>
              🔗 Advanced: Add Image by URL
            </summary>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center',
              marginTop: '8px'
            }}>
              <input 
                className="form-control" 
                placeholder="Enter image URL (https://...)" 
                value={newImageUrl} 
                onChange={(e) => setNewImageUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={addImage}
                disabled={!newImageUrl.trim()}
              >
                ➕ Add URL
              </button>
            </div>
          </details>

          {/* Current Images */}
          {imageList.filter(url => url && url.trim()).length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '12px' 
            }}>
              {imageList.map((src, originalIndex) => {
                // Only render non-empty images
                if (!src || !src.trim()) return null
                
                return (
                  <div key={originalIndex} style={{ 
                    border: '1px solid #374151', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    backgroundColor: '#1f2937' 
                  }}>
                    {/* Image Preview */}
                    <div style={{ 
                      height: '150px', 
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {src && isValidImageUrl(src) ? (
                        <img 
                          src={src} 
                          alt={`Gallery image ${originalIndex + 1}`} 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain' 
                          }}
                          onError={(e) => {
                            console.log('Image failed to load:', src)
                            setFailedImages(prev => new Set([...prev, src]))
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex'
                            }
                          }}
                          onLoad={(e) => {
                            // Image loaded successfully, remove from failed list and hide error message
                            setFailedImages(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(src)
                              return newSet
                            })
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'none'
                            }
                          }}
                        />
                      ) : null}
                      <div style={{
                        display: failedImages.has(src) ? 'flex' : 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        fontSize: '14px',
                        flexDirection: 'column',
                        textAlign: 'center',
                        padding: '10px'
                      }}>
                        <div>❌ Failed to Load</div>
                        <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                          {src && src.length > 50 ? src.substring(0, 50) + '...' : src}
                        </div>
                      </div>
                    </div>
                    
                    {/* Image Controls */}
                    <div style={{ padding: '12px' }}>
                      <input 
                        className="form-control" 
                        value={src} 
                        onChange={(e) => updateImageAt(originalIndex, e.target.value)} 
                        placeholder="Image URL"
                        style={{ marginBottom: '8px' }}
                      />
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#9ca3af',
                          fontWeight: '500'
                        }}>
                          Image {originalIndex + 1}
                        </span>
                        <button 
                          type="button" 
                          className="btn" 
                          onClick={() => removeImage(originalIndex)}
                          style={{ 
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderColor: '#dc2626', 
                            color: '#ef4444' 
                          }}
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }).filter(Boolean)}
            </div>
          )}

          {/* Status Indicator for Edit Mode */}
          {isEdit && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#1b2d1b', 
              border: '1px solid #16a34a',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#86efac'
            }}>
              {(() => {
                const validNewImages = imageList.filter(url => url && url.trim() && isValidImageUrl(url))
                const validCurrentImages = currentImages.filter(url => url && url.trim() && isValidImageUrl(url))
                
                if (validNewImages.length > 0) {
                  return <>➕ <strong>Will Add:</strong> {validNewImages.length} new image{validNewImages.length === 1 ? '' : 's'} will be added to current images (total: {validCurrentImages.length + validNewImages.length}).</>
                } else {
                  return <>✅ <strong>Current Status:</strong> {validCurrentImages.length} image{validCurrentImages.length === 1 ? '' : 's'} will be saved (no new images added).</>
                }
              })()}
            </div>
          )}

          {/* Help Text */}
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#1e293b', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#94a3b8'
          }}>
            💡 <strong>Tip:</strong> {isEdit 
              ? 'Select images from your computer to expand your gallery. New images will be added to existing ones. Use delete buttons above to remove specific current images.'
              : 'Select multiple images from your computer to create an interactive gallery on the product page. Customers can click thumbnails to view different angles and details of your product.'
            }
            <br />
            📋 <strong>Supported formats:</strong> JPG, PNG, GIF, WebP • <strong>Max size:</strong> 5MB per image • <strong>Max files:</strong> 5 at once
          </div>
        </div>
      </fieldset>

      <div>
        <label className="form-label" htmlFor="condition">Condition</label>
        <input className="form-control" id="condition" placeholder="e.g. New, Refurbished" {...bind('condition')} />
      </div>

      <div>
        <label className="form-label" htmlFor="status">Product Status</label>
        <select className="form-control" id="status" {...bind('status')}>
          <option value="available">✅ Available</option>
          <option value="sold">💰 Sold</option>
        </select>
      </div>

      <div>
        <label className="form-label" htmlFor="meta">Meta / Specs</label>
        <textarea className="form-control" id="meta" rows={4} placeholder="e.g. 1080p | HDMI | Smart" {...bind('meta')} />
      </div>

      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#5a2a2a', 
          border: '1px solid #f87171', 
          borderRadius: '6px', 
          color: '#f87171',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}
      
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
