import { NextResponse } from 'next/server'
import { getAdminSession } from '../../../../../lib/adminAuth'
import connectDB from '../../../../../lib/mongodb'
import WithdrawalRequest from '../../../../../models/WithdrawalRequest'

export async function GET(request) {
  try {
    // Verify admin session
    const session = await getAdminSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    
    // Fetch all withdrawal requests
    const rawWithdrawals = await WithdrawalRequest.find({})
      .sort({ createdAt: -1 })
      .lean()

    // Map _id to id for the client component
    const withdrawals = rawWithdrawals.map(w => ({
      ...w,
      id: w._id.toString(),
      _id: w._id.toString()
    }))

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals
    })
    
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests: ' + error.message },
      { status: 500 }
    )
  }
}
