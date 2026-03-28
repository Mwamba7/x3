import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../lib/auth-middleware'
import connectDB from '../../../lib/mongodb'
import Order from '../../../models/Order'
import Cart from '../../../models/Cart'

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

    console.log('💳 Checking deposit status for user:', userId)

    // First check if cart is locked in the Cart collection
    const cart = await Cart.findOne({ userId })
    const isCartLockedInDB = cart ? cart.isLocked : false
    
    console.log('🛒 Cart lock status from database:', {
      userId,
      cartFound: !!cart,
      isLocked: isCartLockedInDB,
      lockedAt: cart?.lockedAt,
      itemsCount: cart?.items?.length || 0
    })

    // Check for recent orders with deposit payments (within last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    
    const recentOrders = await Order.find({
      userId: userId,
      'payment.depositPaid': true,
      createdAt: { $gte: twoHoursAgo }
    }).sort({ createdAt: -1 }).limit(1)

    // Also check for temporary payment lock orders
    const tempOrders = await Order.find({
      userId: userId,
      'payment.depositPaid': true,
      source: 'payment_lock',
      status: 'payment_received',
      createdAt: { $gte: twoHoursAgo }
    }).sort({ createdAt: -1 }).limit(1)

    // Combine both types of orders
    const allRelevantOrders = [...recentOrders, ...tempOrders]
    
    const hasRecentDepositPayment = allRelevantOrders.length > 0
    
    console.log('💰 Deposit payment status:', {
      userId,
      hasRecentDepositPayment,
      orderCount: allRelevantOrders.length,
      recentOrders: recentOrders.length,
      tempOrders: tempOrders.length
    })
    
    if (!hasRecentDepositPayment && !isCartLockedInDB) {
      return NextResponse.json({
        success: true,
        hasDepositPayment: false,
        isCartLocked: false,
        message: 'No active deposit payments or locked cart found'
      })
    }

    // Get the most recent order if exists
    const order = allRelevantOrders.length > 0 ? allRelevantOrders[0] : null
    
    // Determine final cart lock status
    // Priority: Cart database lock > Recent deposit payment
    let finalCartLockStatus = isCartLockedInDB
    
    // If cart is not locked in DB but there's a recent deposit payment, check if it should be locked
    if (!isCartLockedInDB && hasRecentDepositPayment) {
      const isRecentOrder = order.createdAt > new Date(Date.now() - 30 * 60 * 1000) // Within 30 minutes
      finalCartLockStatus = isRecentOrder
    }

    console.log('🔒 Final cart lock decision:', {
      cartLockedInDB: isCartLockedInDB,
      hasRecentDeposit: hasRecentDepositPayment,
      finalStatus: finalCartLockStatus,
      cartItems: cart?.items?.length || 0,
      orderAge: order ? Date.now() - order.createdAt : 'N/A'
    })

    return NextResponse.json({
      success: true,
      hasDepositPayment: hasRecentDepositPayment,
      isCartLocked: finalCartLockStatus,
      deposit: order ? {
        id: order._id,
        orderId: order.orderId,
        depositAmount: order.payment.depositAmount,
        paymentMethod: order.payment.paymentMethod,
        paymentStatus: 'completed',
        depositStatus: 'paid',
        createdAt: order.createdAt
      } : null,
      cart: {
        isLocked: finalCartLockStatus,
        itemsCount: cart?.items?.length || 0,
        lockedAt: cart?.lockedAt,
        paymentReference: cart?.paymentReference
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

// DELETE - Clear deposit status and unlock cart
export async function DELETE(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const userId = authResult.user.id

    console.log('🧹 Clearing deposit status and unlocking cart for user:', userId)

    // Unlock the cart in database
    const cart = await Cart.findOne({ userId })
    if (cart) {
      await cart.unlockCart()
      console.log('✅ Cart unlocked successfully:', {
        userId,
        previousLockStatus: cart.isLocked,
        itemsCount: cart.items?.length || 0
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit status cleared and cart unlocked successfully',
      cartUnlocked: true
    })

  } catch (error) {
    console.error('Error clearing deposit status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
