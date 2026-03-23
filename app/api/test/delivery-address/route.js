import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'

// Test endpoint to debug delivery address issues
export async function GET(request) {
  try {
    console.log('🧪 TEST: Starting delivery address test...')
    
    // Connect to database
    await connectDB()
    console.log('✅ TEST: Database connected')

    // Get auth token
    const token = request.cookies.get('tt_session')?.value
    if (!token) {
      console.log('❌ TEST: No auth token found')
      return NextResponse.json({ error: 'No auth token' }, { status: 401 })
    }
    console.log('✅ TEST: Auth token found')

    // Verify token
    const decoded = jwt.verify(token, process.env.SESSION_SECRET)
    console.log('✅ TEST: Token decoded, user ID:', decoded.userId)

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      console.log('❌ TEST: User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log('✅ TEST: User found:', user.name, user.email)

    // Check current delivery address
    console.log('📍 TEST: Current delivery address:', user.deliveryAddress)

    // Test save operation
    const testAddress = {
      fullName: 'Test User',
      phone: '0712345678',
      street: 'Test Street 123',
      city: 'Test City',
      region: 'Test Region',
      additionalInstructions: 'Test instructions',
      isDefault: true
    }

    console.log('💾 TEST: Attempting to save test address:', testAddress)

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { deliveryAddress: testAddress },
      { new: true, runValidators: true }
    )

    console.log('✅ TEST: Save completed, updated user delivery address:', updatedUser.deliveryAddress)

    // Verify by fetching again
    const verifyUser = await User.findById(decoded.userId).select('deliveryAddress')
    console.log('🔍 TEST: Verification fetch result:', verifyUser.deliveryAddress)

    return NextResponse.json({
      success: true,
      message: 'Test completed successfully',
      originalAddress: user.deliveryAddress,
      testAddress: testAddress,
      savedAddress: updatedUser.deliveryAddress,
      verifiedAddress: verifyUser.deliveryAddress
    })

  } catch (error) {
    console.error('❌ TEST: Error occurred:', error)
    return NextResponse.json({ 
      error: 'Test failed: ' + error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
