import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
import Product from '../../../../../models/Product'
import { getAdminSession } from '../../../../../lib/adminAuth'

export async function POST(request) {
  try {
    // Verify admin session
    const session = await getAdminSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Find the pending product
    const pendingProduct = await PendingProduct.findById(productId)
    if (!pendingProduct) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      )
    }

    // Determine the correct section based on submission type
    // ALL products sold to admin (direct_to_admin) go to preowned section
    const productSection = pendingProduct.submissionType === 'direct_to_admin' ? 'preowned' : 'marketplace'

    // Create a new product from the pending product
    const newProduct = new Product({
      name: pendingProduct.name,
      price: pendingProduct.price,
      category: pendingProduct.category,
      description: pendingProduct.description,
      condition: pendingProduct.condition || 'good',
      img: pendingProduct.coverImage || (pendingProduct.images && pendingProduct.images.length > 0 ? pendingProduct.images[0] : ''), // Use cover image as main image
      images: pendingProduct.images || [],
      section: productSection,  // Set correct section based on submission type
      seller: {
        name: pendingProduct.sellerName,
        phone: pendingProduct.sellerPhone,
        email: pendingProduct.sellerEmail
      },
      status: 'available',
      metadata: {
        source: pendingProduct.submissionType === 'direct_to_admin' ? 'admin-panel' : 'sell-page',
        submissionType: pendingProduct.submissionType,
        originalSeller: {
          name: pendingProduct.sellerName,
          phone: pendingProduct.sellerPhone,
          email: pendingProduct.sellerEmail
        },
        approvedBy: session.username,
        approvedAt: new Date(),
        originalPendingId: pendingProduct._id,
        coverImageIndex: pendingProduct.coverImage ? pendingProduct.images.indexOf(pendingProduct.coverImage) : 0
      }
    })

    await newProduct.save()

    // Update the pending product status
    await PendingProduct.findByIdAndUpdate(productId, {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: session.username
    })

    return NextResponse.json({
      success: true,
      message: 'Product approved and published successfully',
      productId: newProduct._id
    })

  } catch (error) {
    console.error('Approve pending product error:', error)
    return NextResponse.json(
      { error: 'Failed to approve product: ' + error.message },
      { status: 500 }
    )
  }
}
