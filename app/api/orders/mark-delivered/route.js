import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function POST(request) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is required' 
      }, { status: 400 })
    }

    await connectDB()
    
    // Find the order
    const order = await Order.findOne({ orderId: orderId })
    
    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 })
    }

    // Check if order is in receiving stage and remaining payment is made
    if (order.status !== 'receiving') {
      return NextResponse.json({ 
        success: false, 
        error: 'Order must be in receiving stage' 
      }, { status: 400 })
    }

    if (!order.payment.remainingPaid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Remaining payment must be completed before marking as delivered' 
      }, { status: 400 })
    }

    // Update the order status to delivered
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId },
      { 
        status: 'delivered',
        'delivery.actualDate': new Date(),
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    )

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Order marked as delivered successfully'
    })

  } catch (error) {
    console.error('Error marking order as delivered:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to mark order as delivered' 
    }, { status: 500 })
  }
}
