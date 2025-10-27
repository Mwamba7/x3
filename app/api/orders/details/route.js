import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is required' 
      }, { status: 400 })
    }

    await connectDB()
    
    // Find the order by orderId
    const order = await Order.findOne({ orderId: orderId })
    
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      order: order 
    })

  } catch (error) {
    console.error('Error fetching order details:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      orderId: orderId
    })
    return NextResponse.json({ 
      success: false, 
      error: `Failed to fetch order details: ${error.message}` 
    }, { status: 500 })
  }
}
