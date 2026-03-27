import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import WithdrawalRequest from '../../../../../models/WithdrawalRequest'

export async function POST(request) {
  try {
    await connectDB()
    
    const { withdrawalId } = await request.json()

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      )
    }

    // Find and update the withdrawal request
    const withdrawal = await WithdrawalRequest.findById(withdrawalId)
    
    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal request is not pending' },
        { status: 400 }
      )
    }

    // Update status to processing
    withdrawal.status = 'processing'
    withdrawal.processedDate = new Date()
    await withdrawal.save()

    // Send WhatsApp notification to seller
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: [
            '💳 Withdrawal Update',
            '',
            `Your withdrawal request for "${withdrawal.productName}" is now being processed.`,
            '',
            `Amount: Ksh ${withdrawal.withdrawalAmount.toLocaleString('en-KE')}`,
            '',
            'You will receive your payment within 24 hours.'
          ].join('\n'),
          phoneNumber: withdrawal.sellerPhone
        })
      })
    } catch (notificationError) {
      console.error('Failed to send seller notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal marked as processing',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        processedDate: withdrawal.processedDate
      }
    })

  } catch (error) {
    console.error('Process withdrawal error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    )
  }
}
