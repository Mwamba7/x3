import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import Withdrawal from '../../../../models/Withdrawal'
import { verifyAuth } from '../../../../lib/auth-middleware'

export async function POST(request) {
  try {
    // Check authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()
    
    const { productId, paymentMethod, paymentDetails, sellerNotes } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find the product and verify ownership
    const product = await Product.findById(productId)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user owns this product (community marketplace product)
    if (!product.sellerId || product.sellerId.toString() !== authResult.user.id) {
      return NextResponse.json(
        { error: 'You can only request withdrawal for your own products' },
        { status: 403 }
      )
    }

    // Check if product is sold
    if (product.status !== 'sold') {
      return NextResponse.json(
        { error: 'Product must be sold before requesting withdrawal' },
        { status: 400 }
      )
    }

    // Check if withdrawal already requested
    if (product.saleInfo?.withdrawalRequested) {
      return NextResponse.json(
        { error: 'Withdrawal already requested for this product' },
        { status: 400 }
      )
    }

    // Calculate withdrawal amount (deduct platform fee if applicable)
    const salePrice = product.saleInfo?.salePrice || product.price
    const platformFeePercent = 5 // 5% platform fee
    const platformFee = Math.round(salePrice * (platformFeePercent / 100))
    const withdrawalAmount = salePrice - platformFee

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId: authResult.user.id,
      productId: product._id,
      productName: product.name,
      salePrice: salePrice,
      withdrawalAmount: withdrawalAmount,
      platformFee: platformFee,
      paymentMethod: paymentMethod || 'mpesa',
      paymentDetails: paymentDetails || {},
      sellerNotes: sellerNotes || '',
    })

    await withdrawal.save()

    // Update product to mark withdrawal as requested
    await Product.findByIdAndUpdate(productId, {
      'saleInfo.withdrawalRequested': true,
      'saleInfo.withdrawalId': withdrawal._id,
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        withdrawalAmount: withdrawalAmount,
        platformFee: platformFee,
        status: withdrawal.status,
      }
    })

  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { error: 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}
