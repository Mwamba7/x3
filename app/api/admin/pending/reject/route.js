import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
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

    const { productId, reason } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Find and update the pending product
    const pendingProduct = await PendingProduct.findById(productId)
    if (!pendingProduct) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      )
    }

    // Update the pending product status
    await PendingProduct.findByIdAndUpdate(productId, {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: session.username,
      rejectionReason: reason || 'Rejected by admin'
    })

    return NextResponse.json({
      success: true,
      message: 'Product rejected successfully'
    })

  } catch (error) {
    console.error('Reject pending product error:', error)
    return NextResponse.json(
      { error: 'Failed to reject product: ' + error.message },
      { status: 500 }
    )
  }
}
