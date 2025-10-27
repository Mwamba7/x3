import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import WithdrawalRequest from '../../../../models/WithdrawalRequest'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find withdrawal request for this product
    const withdrawal = await WithdrawalRequest.findOne({ productId }).lean()
    
    if (!withdrawal) {
      return NextResponse.json({
        hasWithdrawal: false,
        status: null
      })
    }

    return NextResponse.json({
      hasWithdrawal: true,
      status: withdrawal.status,
      requestDate: withdrawal.requestDate,
      withdrawalAmount: withdrawal.withdrawalAmount,
      serviceFee: withdrawal.serviceFee,
      sellerPhone: withdrawal.sellerPhone
    })

  } catch (error) {
    console.error('Check withdrawal status error:', error)
    return NextResponse.json(
      { error: 'Failed to check withdrawal status' },
      { status: 500 }
    )
  }
}
