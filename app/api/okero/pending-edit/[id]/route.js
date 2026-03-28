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
    const { id } = params
    const updates = await request.json()

    // Validate and update the pending product
    const pendingProduct = await PendingProduct.findById(id)
    if (!pendingProduct) {
      return NextResponse.json({ error: 'Pending product not found' }, { status: 404 })
    }

    // Apply updates
    Object.assign(pendingProduct, updates)
    await pendingProduct.save()

    return NextResponse.json({
      success: true,
      message: 'Pending product updated successfully',
      product: pendingProduct
    })

  } catch (error) {
    console.error('Error updating pending product:', error)
    return NextResponse.json({
      error: 'Failed to update pending product',
      details: error.message
    }, { status: 500 })
  }
}
