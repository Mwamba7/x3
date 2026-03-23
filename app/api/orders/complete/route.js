import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import Order from '../../../../models/Order'
import { verifyAuth } from '../../../../lib/auth-middleware'

export async function POST(request) {
  try {
    console.log('🔌 Attempting to connect to database...')
    const connection = await connectDB()
    console.log('✅ Database connected successfully:', connection.connection.readyState)
    
    // Verify authentication
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated) {
      return NextResponse.json({
        error: 'Authentication required to place orders'
      }, { status: 401 })
    }
    
    const orderData = await request.json()
    
    console.log('📋 Order data received:', JSON.stringify(orderData, null, 2))
    
    // Validate required fields
    if (!orderData.customer || !orderData.items || !orderData.totalAmount) {
      console.log('❌ Missing required fields:', {
        hasCustomer: !!orderData.customer,
        hasItems: !!orderData.items,
        hasTotalAmount: !!orderData.totalAmount
      })
      
      let errorMessage = 'Missing required order data'
      if (!orderData.customer) errorMessage = 'Customer information is required'
      else if (!orderData.items) errorMessage = 'Order items are required'
      else if (!orderData.totalAmount) errorMessage = 'Order total amount is required'
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Validate customer fields
    if (!orderData.customer.name || !orderData.customer.phone) {
      console.log('❌ Missing customer details:', {
        hasName: !!orderData.customer.name,
        hasPhone: !!orderData.customer.phone
      })
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      )
    }

    // Validate items
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      console.log('❌ Invalid items array:', orderData.items)
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }
    
    // Validate each item has required fields
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i]
      if (!item.id || !item.name || !item.price || !item.qty) {
        console.log(`❌ Invalid item at index ${i}:`, item)
        return NextResponse.json(
          { error: `Item "${item.name || 'Unknown'}" is missing required information` },
          { status: 400 }
        )
      }
    }

    // Calculate deposit amount (20% of total)
    const depositAmount = Math.round(orderData.totalAmount * 0.2)
    const remainingAmount = orderData.totalAmount - depositAmount

    // Generate unique order ID
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    const orderId = `ORD-${timestamp}-${random}`.toUpperCase()

    // Create new order
    const order = new Order({
      orderId: orderId,
      userId: authResult.user.id, // Associate order with authenticated user
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        email: orderData.customer.email,
        address: orderData.customer.address
      },
      items: orderData.items.map((item, index) => {
        console.log(`📦 Processing item ${index}:`, item)
        
        if (!item.id || !item.name || !item.price || !item.qty) {
          throw new Error(`Invalid item at index ${index}: missing required fields`)
        }
        
        return {
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.qty,
          condition: item.condition || 'good',
          img: item.img || '',
          lineTotal: item.price * item.qty
        }
      }),
      subtotal: orderData.subtotalAmount,
      deliveryFee: orderData.deliveryFee || 0,
      totalAmount: orderData.totalAmount,
      payment: {
        depositAmount: depositAmount,
        depositPaid: true,
        remainingAmount: remainingAmount,
        paymentMethod: 'M-Pesa + Cash on Delivery',
        transactionId: orderData.transactionId
      },
      delivery: {
        method: orderData.delivery?.method || 'delivery',
        estimatedDate: orderData.delivery?.estimatedDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      status: 'processing',
      whatsappSentAt: new Date(),
      notes: orderData.notes || '',
      source: 'website'
    })

    // Save order to database
    console.log('💾 Attempting to save order...')
    console.log('📋 Order object before save:', JSON.stringify(order.toObject(), null, 2))
    
    const savedOrder = await order.save()

    console.log('✅ Order saved successfully:', savedOrder.orderId)
    console.log('📋 Saved order details:', JSON.stringify(savedOrder.toObject(), null, 2))

    return NextResponse.json({
      success: true,
      orderId: savedOrder.orderId,
      message: 'Order completed successfully'
    })

  } catch (error) {
    console.error('❌ Error completing order:', error)
    return NextResponse.json(
      { error: 'Failed to complete order', details: error.message },
      { status: 500 }
    )
  }
}
