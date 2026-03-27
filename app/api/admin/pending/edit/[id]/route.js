import { NextResponse } from 'next/server'
import connectDB from '../../../../../../lib/mongodb'
import PendingProduct from '../../../../../../models/PendingProduct'
import { getAdminSession } from '../../../../../../lib/adminAuth'

export async function PUT(request, { params }) {
  try {
    // Verify admin session
    const session = await getAdminSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    console.log('Edit request received for ID:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Extract form data
    const formData = await request.formData()
    console.log('FormData received, entries count:', formData.entries.length)
    
    const updateData = {}
    const existingImages = formData.get('existingImages')
    
    // Parse existing images if present
    if (existingImages) {
      try {
        updateData.images = JSON.parse(existingImages)
        console.log('Parsed existing images:', updateData.images)
      } catch (error) {
        console.error('Error parsing existing images:', error)
        // If parsing fails, try to use the original images array
        updateData.images = []
      }
    }
    
    // Add all other form fields
    for (const [key, value] of formData.entries()) {
      console.log('Processing form field:', key, typeof value)
      if (key !== 'existingImages' && !key.startsWith('image')) {
        // Map old category values to new enum values
        if (key === 'category') {
          const categoryMapping = {
            'electronics': 'tv',
            'fashion': 'outfits',
            'home': 'fridge',
            'sports': 'accessory',
            'books': 'accessory',
            'toys': 'accessory',
            'automotive': 'accessory',
            'health': 'accessory',
            'food': 'others',
            'other': 'others'
          }
          updateData[key] = categoryMapping[value] || value
        } 
        // Handle date fields properly
        else if (key === 'reviewedAt' || key === 'createdAt' || key === 'updatedAt') {
          // Only set date if it's a valid date string, not "null" or empty
          if (value && value !== 'null' && value !== 'undefined' && value !== '') {
            updateData[key] = new Date(value)
          }
          // Don't include the field in updateData if it's null/invalid
        }
        // Handle other fields
        else {
          updateData[key] = value
        }
      }
    }
    
    // Handle image files
    const imageReplacements = []
    const updatedImages = [...(updateData.images || [])]
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        const imageIndex = parseInt(key.replace('image', ''))
        console.log('Processing image replacement for index:', imageIndex, 'file:', value.name)
        
        try {
          // Convert image to base64 for storage
          const bytes = await value.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const base64Image = buffer.toString('base64')
          const dataUrl = `data:${value.type};base64,${base64Image}`
          
          // Replace the image at the specific index
          if (imageIndex < updatedImages.length) {
            updatedImages[imageIndex] = dataUrl
            imageReplacements.push({ index: imageIndex, originalName: value.name })
          } else {
            // If index is beyond current array, add new image
            updatedImages.push(dataUrl)
            imageReplacements.push({ index: updatedImages.length - 1, originalName: value.name })
          }
          
          console.log('Image replaced at index:', imageIndex)
        } catch (error) {
          console.error('Error processing image:', error)
        }
      }
    }
    
    // Update the images array with replacements
    if (imageReplacements.length > 0) {
      updateData.images = updatedImages
      updateData.imageReplacements = imageReplacements
      updateData.lastImageUpdate = new Date()
    }
    
    console.log('Final update data:', updateData)
    
    // Update the pending product
    const updatedProduct = await PendingProduct.findByIdAndUpdate(
      id,
      {
        ...updateData,
        lastEditedBy: session.username,
        lastEditedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      )
    }
    
    console.log('Product updated successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })
    
  } catch (error) {
    console.error('Edit pending product error:', error)
    return NextResponse.json(
      { error: 'Failed to update product: ' + error.message },
      { status: 500 }
    )
  }
}
