import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Order from '../../../models/Order'

export async function GET() {
  try {
    console.log('🔍 Testing order completion system...')
    
    // Test 1: Environment variables
    console.log('📋 Environment check:')
    console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI)
    console.log('- MONGODB_URI length:', process.env.MONGODB_URI?.length || 0)
    
    // Test 2: Database connection
    console.log('🔌 Testing database connection...')
    const connection = await connectDB()
    console.log('✅ Database connected:', connection.connection.readyState)
    
    // Test 3: Order model
    console.log('📦 Testing Order model...')
    const orderCount = await Order.countDocuments()
    console.log('📊 Existing orders count:', orderCount)
    
    // Test 4: Create a test order
    console.log('🧪 Creating test order...')
    const testOrder = new Order({
      customer: {
        name: "Test Customer",
        phone: "0712345678",
        email: "test@example.com",
        address: {
          street: "Test Street",
          city: "Nairobi",
          area: "Test Area",
          instructions: "Test instructions"
        }
      },
      items: [{
        productId: "test-123",
        name: "Test Product",
        price: 1000,
        quantity: 1,
        condition: "good",
        img: "/test.jpg",
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
        transactionId: 'TEST_123'
      },
      delivery: {
        method: 'delivery',
        estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      status: 'confirmed',
      whatsappSentAt: new Date(),
      notes: 'Test order',
      source: 'debug'
    })
    
    // Validate before saving
    console.log('🔍 Validating test order...')
    const validationError = testOrder.validateSync()
    if (validationError) {
      console.log('❌ Validation error:', validationError.message)
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationError.message,
        validationErrors: Object.keys(validationError.errors)
      })
    }
    
    console.log('✅ Test order validation passed')
    
    // Try to save
    console.log('💾 Saving test order...')
    const savedOrder = await testOrder.save()
    console.log('✅ Test order saved with ID:', savedOrder.orderId)
    
    // Clean up - delete the test order
    await Order.deleteOne({ _id: savedOrder._id })
    console.log('🗑️ Test order cleaned up')
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      tests: {
        environment: !!process.env.MONGODB_URI,
        database: connection.connection.readyState === 1,
        orderModel: true,
        validation: true,
        save: true,
        cleanup: true
      },
      orderCount: orderCount,
      testOrderId: savedOrder.orderId
    })
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      name: error.name
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    console.log('🧪 Testing with provided order data...')
    
    const orderData = await request.json()
    console.log('📋 Received order data:', JSON.stringify(orderData, null, 2))
    
    // Test database connection
    const connection = await connectDB()
    console.log('✅ Database connected:', connection.connection.readyState)
    
    // Validate the incoming data structure
    const validation = {
      hasCustomer: !!orderData.customer,
      hasCustomerName: !!orderData.customer?.name,
      hasCustomerPhone: !!orderData.customer?.phone,
      hasItems: Array.isArray(orderData.items) && orderData.items.length > 0,
      hasTotalAmount: !!orderData.totalAmount,
      itemsValid: true
    }
    
    // Check each item
    if (orderData.items) {
      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i]
        if (!item.id || !item.name || !item.price || !item.qty) {
          validation.itemsValid = false
          validation.invalidItem = { index: i, item }
          break
        }
      }
    }
    
    console.log('🔍 Validation results:', validation)
    
    if (!validation.hasCustomer || !validation.hasCustomerName || !validation.hasCustomerPhone || 
        !validation.hasItems || !validation.hasTotalAmount || !validation.itemsValid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        validation
      }, { status: 400 })
    }
    
    // Try to create the order object
    const depositAmount = Math.round(orderData.totalAmount * 0.2)
    const remainingAmount = orderData.totalAmount - depositAmount
    
    const order = new Order({
      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        email: orderData.customer.email || '',
        address: orderData.customer.address
      },
      items: orderData.items.map((item, index) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        condition: item.condition || 'good',
        img: item.img || '',
        lineTotal: item.price * item.qty
      })),
      subtotal: orderData.subtotalAmount || orderData.totalAmount,
      deliveryFee: orderData.deliveryFee || 0,
      totalAmount: orderData.totalAmount,
      payment: {
        depositAmount: depositAmount,
        depositPaid: true,
        remainingAmount: remainingAmount,
        paymentMethod: 'M-Pesa + Cash on Delivery',
        transactionId: orderData.transactionId || 'TEST'
      },
      delivery: {
        method: orderData.delivery?.method || 'delivery',
        estimatedDate: orderData.delivery?.estimatedDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      status: 'confirmed',
      whatsappSentAt: new Date(),
      notes: orderData.notes || '',
      source: 'debug-test'
    })
    
    // Validate the order
    const validationError = order.validateSync()
    if (validationError) {
      console.log('❌ Order validation error:', validationError)
      return NextResponse.json({
        success: false,
        error: 'Order validation failed',
        details: validationError.message,
        validationErrors: Object.keys(validationError.errors)
      }, { status: 400 })
    }
    
    // Save the order
    console.log('💾 Saving order...')
    const savedOrder = await order.save()
    console.log('✅ Order saved successfully:', savedOrder.orderId)
    
    return NextResponse.json({
      success: true,
      orderId: savedOrder.orderId,
      message: 'Order created successfully via debug endpoint',
      validation
    })
    
  } catch (error) {
    console.error('❌ Debug test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      name: error.name
    }, { status: 500 })
  }
}
