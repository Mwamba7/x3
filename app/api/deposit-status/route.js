import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../lib/auth-middleware'
import connectDB from '../../../lib/mongodb'
import Order from '../../../models/Order'

// GET user's deposit payment status
export async function GET(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const userId = authResult.user.id

    // Check for recent orders with deposit payments (within last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    
    const recentOrders = await Order.find({
      userId: userId,
      'payment.depositPaid': true,
      createdAt: { $gte: twoHoursAgo }
    }).sort({ createdAt: -1 }).limit(1)

    if (recentOrders.length === 0) {
      return NextResponse.json({
        success: true,
        hasDepositPayment: false,
        isCartLocked: false,
        message: 'No active deposit payments found'
      })
    }

    const order = recentOrders[0]
    const hasValidLockedCart = order.items && order.items.length > 0

    console.log('💳 Deposit status check:', {
      userId,
      orderId: order.orderId,
      depositPaid: order.payment.depositPaid,
      itemsCount: order.items?.length || 0,
      hasValidLockedCart,
      orderItems: order.items
    })

    // Additional validation: Only lock cart if there are actual items and the order is recent
    const isRecentOrder = order.createdAt > new Date(Date.now() - 30 * 60 * 1000) // Within 30 minutes
    const shouldLockCart = hasValidLockedCart && isRecentOrder

    console.log('🔒 Cart lock decision:', {
      hasValidLockedCart,
      isRecentOrder,
      shouldLockCart,
      orderAge: Date.now() - order.createdAt
    })

    return NextResponse.json({
      success: true,
      hasDepositPayment: true,
      isCartLocked: shouldLockCart, // Use the more restrictive condition
      deposit: {
        id: order._id,
        orderId: order.orderId,
        depositAmount: order.payment.depositAmount,
        paymentMethod: order.payment.paymentMethod,
        paymentStatus: 'completed',
        depositStatus: 'paid',
        createdAt: order.createdAt
      },
      cart: {
        isLocked: shouldLockCart,
        itemsCount: order.items?.length || 0
      }
    })

  } catch (error) {
    console.error('Error checking deposit status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update payment status (simplified)
export async function POST(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethod, paymentType, amount, reference, paymentData, orderId } = await request.json()

    if (!paymentMethod || !paymentType || !amount) {
      return NextResponse.json({ error: 'Missing required payment data' }, { status: 400 })
    }

    // For now, just return success - the actual deposit recording happens in order completion
    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully'
    })

  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Clear old deposit status (simplified)
export async function DELETE(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, just return success - old orders naturally expire
    return NextResponse.json({
      success: true,
      message: 'Old deposit status cleared successfully'
    })

  } catch (error) {
    console.error('Error clearing deposit status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
