import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

export async function POST(request) {
  try {
    const { orderId, transactionId, amount } = await request.json()

    if (!orderId || !transactionId || !amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID, transaction ID, and amount are required' 
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

    // Check if order is in receiving stage
    if (order.status !== 'receiving') {
      return NextResponse.json({ 
        success: false, 
        error: 'Order must be in receiving stage to pay remaining amount' 
      }, { status: 400 })
    }

    // Check if remaining amount matches
    if (amount !== order.payment.remainingAmount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment amount does not match remaining amount' 
      }, { status: 400 })
    }

    // Update the order with remaining payment info
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId },
      { 
        'payment.remainingPaid': true,
        'payment.remainingTransactionId': transactionId,
        'payment.remainingPaidAt': new Date(),
        updatedAt: new Date()
      },
      { new: true }
    )

    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: 'Remaining payment processed successfully'
    })

  } catch (error) {
    console.error('Error processing remaining payment:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process remaining payment' 
    }, { status: 500 })
  }
}
