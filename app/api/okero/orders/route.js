import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all orders sorted by most recent first
    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .limit(100) // Limit to last 100 orders for performance
    
    return NextResponse.json({ 
      success: true, 
      orders: orders 
    })

  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch orders' 
    }, { status: 500 })
  }
}
