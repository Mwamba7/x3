import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import WithdrawalRequest from '../../../../models/WithdrawalRequest'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all withdrawal requests
    const withdrawalRequests = await WithdrawalRequest.find({}).lean()
    
    return NextResponse.json({
      success: true,
      count: withdrawalRequests.length,
      withdrawalRequests: withdrawalRequests
    })
    
  } catch (error) {
    console.error('Debug withdrawals error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch withdrawal requests' 
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    await connectDB()
    
    // Clear all withdrawal requests (for debugging)
    const result = await WithdrawalRequest.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} withdrawal requests`
    })
    
  } catch (error) {
    console.error('Clear withdrawals error:', error)
    return NextResponse.json({ 
      error: 'Failed to clear withdrawal requests' 
    }, { status: 500 })
  }
}
