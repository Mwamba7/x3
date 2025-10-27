import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
import Product from '../../../../../models/Product'
import { requireAdmin } from '../../../../../lib/adminAuth'

export async function POST(request) {
  try {
    // Check admin authentication
    console.log('Checking admin authentication...')
    const user = await requireAdmin()
    console.log('User from requireAdmin:', user)
    if (!user) {
      console.log('No user found, unauthorized')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('User authenticated successfully')

    await connectDB()
    
    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find the pending product
    console.log('Looking for pending product with ID:', productId)
    const pendingProduct = await PendingProduct.findById(productId)
    
    if (!pendingProduct) {
      console.log('Pending product not found for ID:', productId)
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      )
    }

    console.log('Found pending product:', {
      id: pendingProduct._id,
      name: pendingProduct.name,
      submissionType: pendingProduct.submissionType,
      status: pendingProduct.status
    })

    if (pendingProduct.status !== 'pending') {
      console.log('Product already reviewed. Status:', pendingProduct.status)
      return NextResponse.json(
        { error: 'Product has already been reviewed' },
        { status: 400 }
      )
    }

    // Create a new product in the main products collection
    // Different handling based on submission type
    const isDirectToAdmin = pendingProduct.submissionType === 'direct_to_admin'
    
    const productData = {
      name: pendingProduct.name || 'Untitled Product',
      category: pendingProduct.category || 'others',
      price: pendingProduct.price || 0,
      description: pendingProduct.description || '',
      img: pendingProduct.images && pendingProduct.images.length > 0 ? pendingProduct.images[0] : '/placeholder.jpg',
      images: pendingProduct.images || [],
      imagesJson: pendingProduct.images ? JSON.stringify(pendingProduct.images) : null,
      meta: pendingProduct.description || '',
      condition: 'Good', // Default condition since PendingProduct doesn't have this field
      inStock: true,
      featured: false,
      status: 'available',
      sellerId: pendingProduct.sellerId // Add sellerId for easier querying
    }

    if (isDirectToAdmin) {
      // For direct-to-admin submissions, create as pre-owned product
      // Modify the category to have preowned prefix
      productData.category = `preowned-${pendingProduct.category || 'others'}`
      productData.condition = 'Good' // Default condition for pre-owned items
      productData.metadata = {
        originalSeller: {
          name: pendingProduct.sellerName,
          phone: pendingProduct.sellerPhone,
          email: pendingProduct.sellerEmail
        },
        submissionType: pendingProduct.submissionType,
        approvedBy: user.username,
        approvedAt: new Date(),
        source: 'sell-page-preowned'
      }
    } else {
      // For public submissions, create as community marketplace product
      productData.metadata = {
        originalSeller: {
          name: pendingProduct.sellerName,
          phone: pendingProduct.sellerPhone,
          email: pendingProduct.sellerEmail
        },
        submissionType: pendingProduct.submissionType,
        approvedBy: user.username,
        approvedAt: new Date(),
        source: 'sell-page'
      }
    }

    console.log('Creating product with data:', JSON.stringify(productData, null, 2))
    
    const newProduct = new Product(productData)
    console.log('Product instance created, attempting to save...')

    await newProduct.save()
    console.log('Product saved successfully with ID:', newProduct._id)

    // Update the pending product status
    console.log('Updating pending product status...')
    await PendingProduct.findByIdAndUpdate(productId, {
      status: 'approved',
      reviewedBy: user.username,
      reviewedAt: new Date()
    })
    console.log('Pending product status updated successfully')

    // Send approval notification to seller (optional)
    try {
      const sectionName = isDirectToAdmin ? 'Pre-owned section' : 'Community Marketplace'
      const approvalMessage = [
        '✅ Product Approved!',
        '',
        `Your product "${pendingProduct.name}" has been approved and published in the ${sectionName}.`,
        '',
        `💰 Price: ${pendingProduct.price ? `Ksh ${pendingProduct.price}` : 'Not specified'}`,
        `📍 Section: ${sectionName}`,
        '',
        'Thank you for using our platform!'
      ].join('\n')

      // Call WhatsApp notification API
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: approvalMessage,
          phoneNumber: pendingProduct.sellerPhone
        })
      })

      // Mark seller as notified
      await PendingProduct.findByIdAndUpdate(productId, { sellerNotified: true })

    } catch (notificationError) {
      console.error('Failed to send approval notification:', notificationError)
      // Don't fail the approval if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Product approved and published to ${isDirectToAdmin ? 'Pre-owned section' : 'Community Marketplace'} successfully`,
      productId: newProduct._id,
      section: isDirectToAdmin ? 'preowned' : 'community'
    })

  } catch (error) {
    console.error('Error approving product:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        error: 'Failed to approve product. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
