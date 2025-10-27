import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

// Get delivery address
export async function GET(request) {
  try {
    await connectDB()
    
    const token = request.cookies.get('auth-token')?.value
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
    
    const token = request.cookies.get('auth-token')?.value
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
    const { fullName, phone, street, city, region, postalCode, additionalInstructions } = requestBody

    // Validation
    if (!fullName || fullName.length < 2) {
      console.log('Full name validation failed:', fullName)
      return NextResponse.json({ error: 'Full name is required and must be at least 2 characters' }, { status: 400 })
    }

    if (!phone || !/^(\+254|254|0)[17]\d{8}$/.test(phone)) {
      console.log('Phone validation failed:', phone)
      return NextResponse.json({ error: 'Please enter a valid Kenyan phone number' }, { status: 400 })
    }

    if (!street || street.length < 5) {
      console.log('Street validation failed:', street)
      return NextResponse.json({ error: 'Street address is required and must be at least 5 characters' }, { status: 400 })
    }

    if (!city || city.length < 2) {
      console.log('City validation failed:', city)
      return NextResponse.json({ error: 'City is required and must be at least 2 characters' }, { status: 400 })
    }

    if (!region || region.length < 2) {
      console.log('Region validation failed:', region)
      return NextResponse.json({ error: 'Region/County is required and must be at least 2 characters' }, { status: 400 })
    }

    // Update delivery address
    const deliveryAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      region: region.trim(),
      postalCode: postalCode ? postalCode.trim() : '',
      additionalInstructions: additionalInstructions ? additionalInstructions.trim() : '',
      isDefault: true
    }

    console.log('Updating delivery address with data:', deliveryAddress)

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { deliveryAddress },
      { new: true, runValidators: true }
    ).select('deliveryAddress')

    if (!user) {
      console.log('User not found for ID:', decoded.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Delivery address updated successfully for user:', decoded.userId)
    console.log('Saved delivery address:', user.deliveryAddress)
    
    return NextResponse.json({ 
      message: 'Delivery address updated successfully',
      deliveryAddress: user.deliveryAddress
    })
  } catch (error) {
    console.error('Delivery address update error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update delivery address: ' + error.message }, { status: 500 })
  }
}
