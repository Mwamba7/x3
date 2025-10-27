import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Withdrawal from '../../../../models/Withdrawal'
import { verifyAuth } from '../../../../lib/auth-middleware'

export async function GET(request) {
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
    
    // Fetch user's withdrawals
    const withdrawals = await Withdrawal.find({
      userId: authResult.user.id
    }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals
    })

  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}
