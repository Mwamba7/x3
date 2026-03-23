import { NextResponse } from 'next/server'
import Order from '../../../../models/Order'
import connectDB from '../../../../lib/mongodb'
import { verifyAuth } from '../../../../lib/auth-middleware'

export async function GET(request) {
  try {
    await connectDB()
    
    // Verify authentication using the same method as order creation
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    console.log('🔍 Fetching orders for user ID:', authResult.user.id)
    
    // Fetch user's orders using the same user ID format as order creation
    const orders = await Order.find({ userId: authResult.user.id })
      .sort({ createdAt: -1 })
      .limit(50)

    console.log('📋 Found orders:', orders.length)
    
    return NextResponse.json({
      success: true,
      orders: orders
    })

  } catch (error) {
    console.error('❌ Error fetching user orders:', error)
    return NextResponse.json({
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}
