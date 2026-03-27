import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
import { requireAdmin } from '../../../../../lib/adminAuth'

export async function DELETE(request) {
  try {
    // Check admin authentication
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    
    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find and delete the pending product
    const deletedProduct = await PendingProduct.findByIdAndDelete(productId)
    
    if (!deletedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    console.log(`Product submission deleted by admin: ${deletedProduct.name} (ID: ${productId})`)

    return NextResponse.json({
      success: true,
      message: 'Product submission deleted successfully',
      productName: deletedProduct.name
    })

  } catch (error) {
    console.error('Error deleting pending product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product submission. Please try again.' },
      { status: 500 }
    )
  }
}
