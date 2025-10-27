import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import Order from '../../../../models/Order'
import connectDB from '../../../../lib/mongodb'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret')
    
    // Fetch user's orders
    const orders = await Order.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(50)

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
