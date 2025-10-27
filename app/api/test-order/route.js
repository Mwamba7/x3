import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Order from '../../../models/Order'

export async function POST() {
  try {
    console.log('🧪 Testing order creation...')
    
    // Connect to database
    await connectDB()
    
    // Create test order
    const testOrder = new Order({
      customer: {
        name: 'Test Customer',
        phone: '0712345678',
        email: 'test@example.com',
        address: {
          street: 'Test Street',
          city: 'Nairobi',
          area: 'Test Area'
        }
      },
      items: [{
        productId: 'test-product-1',
        name: 'Test Product',
        price: 1000,
        quantity: 1,
        condition: 'good',
        img: 'test.jpg',
        lineTotal: 1000
      }],
      subtotal: 1000,
      deliveryFee: 80,
      totalAmount: 1080,
      payment: {
        depositAmount: 216,
        depositPaid: true,
        remainingAmount: 864,
        paymentMethod: 'M-Pesa + Cash on Delivery',
        transactionId: 'TEST123'
      },
      delivery: {
        method: 'delivery',
        estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      status: 'confirmed',
      notes: 'Test order',
      source: 'website'
    })
    
    console.log('💾 Saving test order...')
    const savedOrder = await testOrder.save()
    console.log('✅ Test order saved:', savedOrder.orderId)
    
    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      orderId: savedOrder.orderId,
      order: savedOrder
    })
    
  } catch (error) {
    console.error('❌ Test order creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
