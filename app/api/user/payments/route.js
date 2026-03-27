import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()
    const { userPhone } = await request.json()
    
    if (!userPhone) {
      return NextResponse.json({ payments: [] })
    }
    
    // Get all user payments from database (from orders)
    const orders = await Order.find({ 
      'customer.phone': userPhone,
      depositPaid: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 })
    
    const payments = orders.map(order => ({
      id: order.orderId,
      type: 'deposit',
      amount: order.depositAmount,
      totalAmount: order.totalAmount,
      remainingAmount: order.remainingAmount,
      status: order.depositPaid ? 'paid' : 'pending',
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      customer: order.customer,
      items: order.items,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))
    
    return NextResponse.json({ 
      success: true,
      payments: payments
    })
    
  } catch (error) {
    console.error('Error fetching user payments:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message,
      payments: []
    }, { status: 500 })
  }
}
