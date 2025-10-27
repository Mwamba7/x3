import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'

// Test database connection
export async function GET(request) {
  try {
    console.log('🧪 DB TEST: Starting database connection test...')
    
    // Check environment variables
    console.log('🧪 DB TEST: MONGODB_URI exists:', !!process.env.MONGODB_URI)
    console.log('🧪 DB TEST: SESSION_SECRET exists:', !!process.env.SESSION_SECRET)
    
    // Test database connection
    const db = await connectDB()
    console.log('✅ DB TEST: Database connected successfully')
    console.log('🧪 DB TEST: Connection state:', db.connection.readyState)
    console.log('🧪 DB TEST: Database name:', db.connection.name)
    
    // Test User model
    const userCount = await User.countDocuments()
    console.log('🧪 DB TEST: Total users in database:', userCount)
    
    // Test finding a user (first one)
    const firstUser = await User.findOne().select('name email deliveryAddress')
    console.log('🧪 DB TEST: Sample user:', firstUser ? {
      id: firstUser._id,
      name: firstUser.name,
      email: firstUser.email,
      hasDeliveryAddress: !!firstUser.deliveryAddress
    } : 'No users found')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test passed',
      connectionState: db.connection.readyState,
      databaseName: db.connection.name,
      userCount: userCount,
      sampleUser: firstUser ? {
        id: firstUser._id,
        name: firstUser.name,
        email: firstUser.email,
        hasDeliveryAddress: !!firstUser.deliveryAddress,
        deliveryAddress: firstUser.deliveryAddress
      } : null
    })
    
  } catch (error) {
    console.error('❌ DB TEST: Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
