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

    if (withdrawal.status !== 'processing') {
      return NextResponse.json(
        { error: 'Withdrawal request is not being processed' },
        { status: 400 }
      )
    }

    // Update status to completed
    withdrawal.status = 'completed'
    withdrawal.processedDate = new Date()
    await withdrawal.save()

    // Send WhatsApp notification to seller
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: [
            '✅ Payment Sent!',
            '',
            `Your withdrawal for "${withdrawal.productName}" has been completed.`,
            '',
            `Amount Sent: Ksh ${withdrawal.withdrawalAmount.toLocaleString('en-KE')}`,
            `To: ${withdrawal.sellerPhone}`,
            '',
            'Thank you for using our platform!'
          ].join('\n'),
          phoneNumber: withdrawal.sellerPhone
        })
      })
    } catch (notificationError) {
      console.error('Failed to send completion notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal completed successfully',
      withdrawal: {
        id: withdrawal._id,
        status: withdrawal.status,
        processedDate: withdrawal.processedDate
      }
    })

  } catch (error) {
    console.error('Complete withdrawal error:', error)
    return NextResponse.json(
      { error: 'Failed to complete withdrawal request' },
      { status: 500 }
    )
  }
}
