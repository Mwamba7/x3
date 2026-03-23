import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../lib/auth-middleware'
import connectDB from '../../../lib/mongodb'
import Order from '../../../models/Order'

// GET user's deposits
export async function GET(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const userId = authResult.user.id

    // Get user's orders with deposit payments
    const orders = await Order.find({
      userId: userId,
      'payment.depositPaid': true
    }).sort({ createdAt: -1 }).limit(50)

    const deposits = orders.map(order => ({
      id: order._id,
      orderId: order.orderId,
      depositAmount: order.payment.depositAmount,
      totalAmount: order.totalAmount,
      balanceAmount: order.payment.remainingAmount,
      paymentMethod: order.payment.paymentMethod,
      paymentReference: order.payment.transactionId,
      paymentStatus: 'completed',
      depositStatus: 'paid',
      cartItems: order.items,
      customerDetails: order.customer,
      paymentData: order.payment,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderStatus: order.status
    }))

    return NextResponse.json({
      success: true,
      deposits: deposits,
      summary: {
        totalDeposits: deposits.length,
        totalAmount: deposits.reduce((sum, d) => sum + d.depositAmount, 0),
        pendingDeposits: 0,
        completedDeposits: deposits.length
      }
    })

  } catch (error) {
    console.error('Error fetching deposits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new deposit record (simplified)
export async function POST(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      orderId,
      depositAmount,
      totalAmount,
      balanceAmount,
      paymentMethod,
      paymentReference,
      cartItems,
      customerDetails,
      paymentData
    } = await request.json()

    if (!orderId || !depositAmount || !totalAmount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For now, just return success - the actual deposit recording happens in order completion
    return NextResponse.json({
      success: true,
      message: 'Deposit recorded successfully',
      depositId: orderId
    })

  } catch (error) {
    console.error('Error creating deposit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update deposit status (simplified)
export async function PUT(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { depositId, newStatus, notes } = await request.json()

    if (!depositId || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For now, just return success - status updates happen through order management
    return NextResponse.json({
      success: true,
      message: 'Deposit status updated successfully'
    })

  } catch (error) {
    console.error('Error updating deposit status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
