import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import PendingProduct from '../../../../models/PendingProduct'

export async function POST() {
  try {
    await connectDB()
    
    console.log('🧹 Starting cleanup of approved pending products...')
    
    // Find and remove pending products that are already approved
    const result = await PendingProduct.deleteMany({
      status: 'approved'
    })
    
    console.log(`✅ Cleaned up ${result.deletedCount} approved pending products`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${result.deletedCount} approved pending products`,
      deletedCount: result.deletedCount
    })
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup approved pending products: ' + error.message
    }, { status: 500 })
  }
}
