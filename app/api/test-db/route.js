import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import Order from '../../../models/Order'

export async function GET() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test database connection
    const connection = await connectDB()
    console.log('✅ Database connected:', connection.connection.readyState)
    
    // Test Order model
    console.log('📋 Testing Order model...')
    
    // Try to count existing orders
    const orderCount = await Order.countDocuments()
    console.log('📊 Existing orders count:', orderCount)
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      connectionState: connection.connection.readyState,
      existingOrders: orderCount,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    }, { status: 500 })
  }
}
