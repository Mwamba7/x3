import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import mongoose from 'mongoose'

// GET - Fetch all withdrawal requests for admin
export async function GET() {
  try {
    await connectDB()
    const db = mongoose.connection.db
    
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
