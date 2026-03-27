import { NextResponse } from 'next/server'
import connectDB from '../../../../../lib/mongodb'
import Order from '../../../../../models/Order'
import { getAdminSession } from '../../../../../lib/adminAuth'

export async function POST(request) {
  try {
    // Verify admin session
    const session = await getAdminSession()
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId, status } = await request.json()
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    // Update order status by orderId field (not _id)
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId }, // Find by orderId field, not _id
      { 
        status: status,
        updatedAt: new Date()
      },
      { new: true }
    ).lean()
    
    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    })
    
  } catch (error) {
    console.error('Order status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order status: ' + error.message },
      { status: 500 }
    )
  }
}
