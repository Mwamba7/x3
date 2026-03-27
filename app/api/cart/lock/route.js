import { NextResponse } from 'next/server'
import { verifyAuth } from '../../../../lib/auth-middleware'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'

// POST - Lock cart after successful payment
export async function POST(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const paymentData = await request.json()
    console.log('🔒 Cart lock request received:', paymentData)

    if (!paymentData.depositPaid) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 })
    }

    await connectDB()

    // Create a temporary order record to indicate cart is locked
    // This will be updated when the user completes the full order
    const tempOrder = new Order({
      orderId: `TEMP-${Date.now()}`,
      userId: authResult.user.id,
      customer: {
        name: paymentData.customerName || 'Pending',
        phone: paymentData.customerPhone || '',
        email: paymentData.customerEmail || ''
      },
      items: [], // Will be populated from cart during order completion
      totalAmount: paymentData.totalAmount || 0,
      payment: {
        depositAmount: paymentData.paidAmount || 0,
        depositPaid: true,
        remainingAmount: paymentData.balanceAmount || 0,
        paymentMethod: paymentData.paymentMethod || 'paystack',
        transactionId: paymentData.paymentReference
      },
      status: 'payment_received',
      source: 'payment_lock',
      notes: 'Temporary order created for cart locking after deposit payment'
    })

    await tempOrder.save()
    console.log('✅ Temporary order created for cart lock:', tempOrder.orderId)

    return NextResponse.json({ 
      success: true, 
      message: 'Cart locked successfully',
      orderId: tempOrder.orderId
    })

  } catch (error) {
    console.error('Error locking cart:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Check cart lock status (simplified)
export async function GET(request) {
  try {
    // Verify authentication using custom auth middleware
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return unlocked status - actual lock status comes from deposit status API
    return NextResponse.json({ 
      success: true, 
      is_locked: false, 
      has_items: false 
    })

  } catch (error) {
    console.error('Error checking cart status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
