import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

// Get delivery address
export async function GET(request) {
  try {
    await connectDB()
    
    const token = request.cookies.get('tt_session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET)
    const user = await User.findById(decoded.userId).select('deliveryAddress')
    
    if (!user) {
      console.log('User not found for ID:', decoded.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Fetched delivery address for user:', decoded.userId)
    console.log('Retrieved delivery address:', user.deliveryAddress)

    return NextResponse.json({ deliveryAddress: user.deliveryAddress || {} })
  } catch (error) {
    console.error('Delivery address fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery address' }, { status: 500 })
  }
}

// Update delivery address
export async function PUT(request) {
  try {
    console.log('Delivery address update request received')
    await connectDB()
    
    const token = request.cookies.get('tt_session')?.value
    if (!token) {
      console.log('No auth token found')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.SESSION_SECRET)
      console.log('Token decoded for user:', decoded.userId)
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    const requestBody = await request.json()
    console.log('Request body:', requestBody)
    const { street, town, city, region, postalCode, additionalInstructions } = requestBody

    // Validation - only address fields since name/phone are in profile
    if (!street || street.length < 5) {
      console.log('Street validation failed:', street)
      return NextResponse.json({ error: 'Street address is required and must be at least 5 characters' }, { status: 400 })
    }

    // Handle both town and city field names for compatibility
    const cityValue = city || town
    if (!cityValue || cityValue.length < 2) {
      console.log('City validation failed:', cityValue)
      return NextResponse.json({ error: 'City is required and must be at least 2 characters' }, { status: 400 })
    }

    if (!region || region.length < 2) {
      console.log('Region validation failed:', region)
      return NextResponse.json({ error: 'Region is required and must be at least 2 characters' }, { status: 400 })
    }

    // Update delivery address
    // Get user profile to include name and phone
    const user = await User.findById(decoded.userId).select('name phone')
    if (!user) {
      console.log('User not found for ID:', decoded.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const deliveryAddress = {
      fullName: user.name,
      phone: user.phone,
      street: street.trim(),
      city: (city || town).trim(),
      region: region.trim(),
      postalCode: postalCode ? postalCode.trim() : '',
      additionalInstructions: additionalInstructions ? additionalInstructions.trim() : '',
      isDefault: true
    }

    console.log('Updating delivery address with data:', deliveryAddress)

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { deliveryAddress },
      { new: true, runValidators: true }
    ).select('deliveryAddress')

    if (!updatedUser) {
      console.log('User not found for ID:', decoded.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Delivery address updated successfully for user:', decoded.userId)
    console.log('Saved delivery address:', updatedUser.deliveryAddress)
    
    return NextResponse.json({ 
      message: 'Delivery address updated successfully',
      deliveryAddress: updatedUser.deliveryAddress
    })
  } catch (error) {
    console.error('Delivery address update error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update delivery address: ' + error.message }, { status: 500 })
  }
}
