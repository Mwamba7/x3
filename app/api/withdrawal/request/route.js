import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import WithdrawalRequest from '../../../../models/WithdrawalRequest'

export async function POST(request) {
  try {
    await connectDB()
    
    const {
      productId,
      productName,
      productPrice,
      sellerName,
      sellerPhone,
      withdrawalAmount,
      serviceFee
    } = await request.json()

    // Validate required fields
    if (!productId || !productName || !productPrice || !sellerName || !sellerPhone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    const phoneRegex = /^(\+254|0)[17]\d{8}$/
    if (!phoneRegex.test(sellerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check if withdrawal request already exists for this product
    const existingRequest = await WithdrawalRequest.findOne({ productId })
    if (existingRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request already exists for this product' },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      productId,
      productName,
      productPrice,
      sellerName,
      sellerPhone,
      withdrawalAmount,
      serviceFee,
      status: 'pending',
      requestDate: new Date()
    })

    await withdrawalRequest.save()

    // Send WhatsApp notification to admin
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'withdrawal_request',
          data: {
            productName,
            sellerName,
            sellerPhone,
            withdrawalAmount: withdrawalAmount.toLocaleString('en-KE'),
            serviceFee: serviceFee.toLocaleString('en-KE'),
            productPrice: productPrice.toLocaleString('en-KE')
          }
        })
      })
    } catch (notificationError) {
      console.error('Failed to send WhatsApp notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      requestId: withdrawalRequest._id
    })

  } catch (error) {
    console.error('Withdrawal request error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    )
  }
}
