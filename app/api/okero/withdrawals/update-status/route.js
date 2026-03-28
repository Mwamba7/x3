import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import WithdrawalRequest from '../../../../../models/WithdrawalRequest'
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

    const { withdrawalId, status } = await request.json()
    
    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: 'Withdrawal ID and status are required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Update withdrawal status
    const updatedWithdrawal = await WithdrawalRequest.findByIdAndUpdate(
      withdrawalId,
      { 
        status: status,
        processedBy: session.username,
        processedAt: new Date()
      },
      { new: true }
    ).lean()
    
    if (!updatedWithdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Withdrawal status updated successfully',
      withdrawal: updatedWithdrawal
    })
    
  } catch (error) {
    console.error('Withdrawal status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update withdrawal status: ' + error.message },
      { status: 500 }
    )
  }
}
