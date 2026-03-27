'use client'

import { useState } from 'react'

export default function EditPendingProductClient({ product: initialProduct }) {
  const [product, setProduct] = useState(initialProduct)
  const [loading, setLoading] = useState(false)
  const [newImages, setNewImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState(initialProduct.images || [])
  const [replaceImageIndex, setReplaceImageIndex] = useState(null)
  const [coverImageIndex, setCoverImageIndex] = useState(
    initialProduct.coverImage ? initialProduct.images.indexOf(initialProduct.coverImage) : 0
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProduct(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
    
    // Create previews for new images
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImagePreviews(newPreviews)
    
    // If removing an original image, update product images
    if (index < initialProduct.images.length) {
      const newProductImages = product.images.filter((_, i) => i !== index)
      setProduct(prev => ({
        ...prev,
        images: newProductImages
      }))
    }
    
    // Adjust cover image index if necessary
    if (coverImageIndex === index) {
      setCoverImageIndex(0) // Reset to first image
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1) // Adjust index
    }
  }

  const setCoverImage = (index) => {
    setCoverImageIndex(index)
    setProduct(prev => ({
      ...prev,
      coverImage: imagePreviews[index]
    }))
  }

  const replaceImage = (index) => {
    setReplaceImageIndex(index)
    // Trigger file input click
    const input = document.getElementById(`replace-image-${index}`)
    if (input) {
      input.click()
    }
  }

  const handleReplaceImage = (index, e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newPreviews = [...imagePreviews]
        newPreviews[index] = event.target.result
        setImagePreviews(newPreviews)
        
        // Add to replaced images array with proper indexing
        setNewImages(prev => {
          // Remove any existing replacement for this index
          const filtered = prev.filter(img => img.index !== index)
          // Add the new replacement
          return [...filtered, { index, file }]
        })
      }
      reader.readAsDataURL(file)
    }
    setReplaceImageIndex(null)
  }

  const handleSave = async () => {
    setLoading(true)
    
    try {
      const formData = new FormData()
      
      // Only send editable fields, exclude system fields
      const editableFields = [
        'name', 'price', 'category', 'description', 
        'sellerName', 'sellerPhone', 'sellerEmail', 'coverImage'
      ]
      
      editableFields.forEach(key => {
        if (product[key] !== undefined && product[key] !== null) {
          formData.append(key, product[key])
        }
      })
      
      // Send current images array (with original URLs)
      if (imagePreviews && imagePreviews.length > 0) {
        formData.append('existingImages', JSON.stringify(imagePreviews))
      }
      
      // Send replaced image files
      newImages.forEach((imageObj, index) => {
        if (imageObj.file) {
          formData.append(`image${imageObj.index}`, imageObj.file)
        }
      })

      const response = await fetch(`/api/admin/pending/edit/${product._id}`, {
        method: 'PUT',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        alert('✅ Product updated successfully!')
        window.location.href = '/okero/pending'
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('❌ Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--background-secondary)', borderRadius: 12, padding: 24 }}>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Product Images */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>📷 Product Images</h3>
          
          {/* Cover Image Section */}
          {imagePreviews.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 'bold' }}>Cover Image</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: 12, 
                marginBottom: 16 
              }}>
                {imagePreviews.map((image, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      position: 'relative',
                      border: coverImageIndex === index ? '3px solid #28a745' : '1px solid #253049',
                      borderRadius: 8,
                      padding: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => setCoverImage(index)}
                  >
                    <img 
                      src={image} 
                      alt={`Product image ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: 150, 
                        objectFit: 'cover', 
                        borderRadius: 4
                      }}
                    />
                    {coverImageIndex === index && (
                      <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: '#28a745',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      {coverImageIndex === index ? 'Cover' : `Image ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                ✅ Current Cover Image: Image {coverImageIndex + 1} - This image will be used as the main product photo
              </p>
            </div>
          )}
          
          {/* All Images Management */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 'bold' }}>📸 Manage All Images</h4>
            {imagePreviews.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                gap: 12, 
                marginBottom: 16 
              }}>
                {imagePreviews.map((image, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img 
                      src={image} 
                      alt={`Product image ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        height: 150, 
                        objectFit: 'cover', 
                        borderRadius: 8,
                        border: '1px solid #253049'
                      }}
                    />
                    
                    {/* Replace Image Icon */}
                    <button
                      type="button"
                      onClick={() => replaceImage(index)}
                      title="Replace image"
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      }}
                    >
                      🔄
                    </button>
                    
                    {/* Remove Image Icon */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontSize: 12,
                        zIndex: 2
                      }}
                    >
                      ×
                    </button>
                    
                    {/* Hidden file input for replacement */}
                    <input
                      id={`replace-image-${index}`}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleReplaceImage(index, e)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Add New Images:
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #253049',
                borderRadius: 4,
                background: 'var(--background)'
              }}
            />
          </div>
        </div>

        {/* Product Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Product Name:
            </label>
            <input
              type="text"
              name="name"
              value={product.name || ''}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #253049',
                borderRadius: 4,
                background: 'var(--background)',
                color: 'var(--text)'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Price (Ksh):
            </label>
            <input
              type="number"
              name="price"
              value={product.price || ''}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #253049',
                borderRadius: 4,
                background: 'var(--background)',
                color: 'var(--text)'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Category:
          </label>
          <select
            name="category"
            value={product.category || ''}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #253049',
              borderRadius: 4,
              background: 'var(--background)',
              color: 'var(--text)'
            }}
          >
            <option value="">Select Category</option>
            <option value="tv">TV & Electronics</option>
            <option value="radio">Radio & Sound</option>
            <option value="phone">Mobile Phones</option>
            <option value="fridge">Fridges & Appliances</option>
            <option value="cooler">Coolers & Appliances</option>
            <option value="accessory">Accessories</option>
            <option value="outfits">Outfits</option>
            <option value="hoodies">Hoodies</option>
            <option value="shoes">Shoes</option>
            <option value="sneakers">Sneakers</option>
            <option value="ladies">Ladies Fashion</option>
            <option value="men">Men Fashion</option>
            <option value="others">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Description:
          </label>
          <textarea
            name="description"
            value={product.description || ''}
            onChange={handleInputChange}
            rows={4}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #253049',
              borderRadius: 4,
              background: 'var(--background)',
              color: 'var(--text)',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Seller Details */}
        <div style={{ 
          background: 'var(--background)', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 16 
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 16 }}>👤 Seller Details</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Seller Name:
              </label>
              <input
                type="text"
                name="sellerName"
                value={product.sellerName || ''}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #253049',
                  borderRadius: 4,
                  background: 'var(--background)',
                  color: 'var(--text)'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Seller Phone:
              </label>
              <input
                type="tel"
                name="sellerPhone"
                value={product.sellerPhone || ''}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #253049',
                  borderRadius: 4,
                  background: 'var(--background)',
                  color: 'var(--text)'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
              Seller Email:
            </label>
            <input
              type="email"
              name="sellerEmail"
              value={product.sellerEmail || ''}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #253049',
                borderRadius: 4,
                background: 'var(--background)',
                color: 'var(--text)'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <a 
            href="/okero/pending" 
            className="btn"
            style={{ background: '#6c757d', color: 'white' }}
          >
            Cancel
          </a>
          
          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ 
              background: '#27ae60', 
              color: 'white',
              opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
