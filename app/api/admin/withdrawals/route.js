import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

// GET - Fetch all withdrawal requests for admin
export async function GET() {
  try {
    const { db } = await connectToDatabase()
    
    // Fetch all withdrawal requests sorted by most recent
    const withdrawals = await db.collection('withdrawalRequests').find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({ 
      success: true, 
      withdrawals: withdrawals.map(w => ({
        ...w,
        _id: w._id.toString()
      }))
    })
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    )
  }
}
