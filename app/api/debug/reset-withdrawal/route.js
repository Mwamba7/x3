import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Product from '../../../../models/Product'
import WithdrawalRequest from '../../../../models/WithdrawalRequest'

export async function POST(request) {
  try {
    await connectDB()
    
    const { productId } = await request.json()
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Product ID is required' 
      }, { status: 400 })
    }
    
    // Reset the product's withdrawal flag
    await Product.findByIdAndUpdate(productId, {
      withdrawalRequested: false,
      $unset: { withdrawalRequestedAt: 1 }
    })
    
    // Remove any orphaned withdrawal requests for this product
    await WithdrawalRequest.deleteMany({ productId: productId })
    
    return NextResponse.json({
      success: true,
      message: 'Product withdrawal status reset successfully'
    })
    
  } catch (error) {
    console.error('Reset withdrawal error:', error)
    return NextResponse.json({ 
      error: 'Failed to reset withdrawal status' 
    }, { status: 500 })
  }
}
