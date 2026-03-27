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

    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Find and delete the pending product
    const deletedProduct = await PendingProduct.findByIdAndDelete(productId)
    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Delete pending product error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product: ' + error.message },
      { status: 500 }
    )
  }
}
