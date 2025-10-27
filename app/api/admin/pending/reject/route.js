import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import PendingProduct from '../../../../../models/PendingProduct'
import { requireAdmin } from '../../../../../lib/adminAuth'

export async function POST(request) {
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
    
    const { productId, reason } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find the pending product
    const pendingProduct = await PendingProduct.findById(productId)
    
    if (!pendingProduct) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      )
    }

    if (pendingProduct.status !== 'pending') {
      return NextResponse.json(
        { error: 'Product has already been reviewed' },
        { status: 400 }
      )
    }

    // Update the pending product status
    await PendingProduct.findByIdAndUpdate(productId, {
      status: 'rejected',
      reviewedBy: user.username,
      reviewedAt: new Date(),
      rejectionReason: reason || 'No reason provided'
    })

    // Send rejection notification to seller
    try {
      const rejectionMessage = [
        '❌ Product Not Approved',
        '',
        `Your product "${pendingProduct.name}" was not approved.`,
        '',
        reason ? `Reason: ${reason}` : 'Please contact admin for more details.',
        '',
        'You can resubmit with corrections if needed.'
      ].join('\n')

      // Call WhatsApp notification API
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/whatsapp/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: rejectionMessage,
          phoneNumber: pendingProduct.sellerPhone
        })
      })

      // Mark seller as notified
      await PendingProduct.findByIdAndUpdate(productId, { sellerNotified: true })

    } catch (notificationError) {
      console.error('Failed to send rejection notification:', notificationError)
      // Don't fail the rejection if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Product rejected and seller notified'
    })

  } catch (error) {
    console.error('Error rejecting product:', error)
    return NextResponse.json(
      { error: 'Failed to reject product. Please try again.' },
      { status: 500 }
    )
  }
}
