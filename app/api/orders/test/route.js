import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get all orders to see what's in the database
    const orders = await Order.find({}).limit(5)
    
    return NextResponse.json({ 
      success: true, 
      count: orders.length,
      orders: orders.map(order => ({
        orderId: order.orderId,
        customerName: order.customer?.name,
        customerPhone: order.customer?.phone,
        status: order.status,
        createdAt: order.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching test orders:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Database error: ${error.message}` 
    }, { status: 500 })
  }
}
