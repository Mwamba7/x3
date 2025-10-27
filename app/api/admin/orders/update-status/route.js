import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import Order from '../../../../../models/Order'

export async function POST(request) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID and status are required' 
      }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['processing', 'in_transit', 'receiving', 'delivered']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      }, { status: 400 })
    }

    await connectDB()
    
    // Update the order status
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId },
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!updatedOrder) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: `Order status updated to ${status}`
    })

  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update order status' 
    }, { status: 500 })
  }
}
