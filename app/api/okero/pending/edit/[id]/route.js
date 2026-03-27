import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
import { requireAdmin } from '../../../../../lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const product = await PendingProduct.findById(params.id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const formData = await request.formData()
    
    // Update product fields
    const updateData = {}
    const fieldsToUpdate = [
      'name', 'price', 'category', 'description', 
      'sellerName', 'sellerPhone', 'sellerEmail'
    ]
    
    fieldsToUpdate.forEach(field => {
      if (formData.get(field)) {
        updateData[field] = formData.get(field)
      }
    })

    // Handle images
    let finalImages = []
    
    // Keep existing images
    if (formData.get('existingImages')) {
      try {
        const existingImages = JSON.parse(formData.get('existingImages'))
        finalImages = [...existingImages]
      } catch (error) {
        console.error('Error parsing existing images:', error)
      }
    }
    
    // Add new images (in a real app, you'd upload these to a storage service)
    // For now, we'll just acknowledge they exist
    const newImageKeys = []
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('newImage') && value) {
        // In a real implementation, you'd upload the file and get a URL
        // For now, we'll create a placeholder
        newImageKeys.push(`new_image_${Date.now()}_${key}`)
      }
    }
    
    finalImages = [...finalImages, ...newImageKeys]
    updateData.images = finalImages

    // Update the product
    Object.assign(product, updateData)
    await product.save()

    return NextResponse.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: product.toObject()
    })

  } catch (error) {
    console.error('Edit product error:', error)
    return NextResponse.json({ 
      error: 'Failed to update product',
      details: error.message 
    }, { status: 500 })
  }
}
