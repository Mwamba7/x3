import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

// Get user profile
export async function GET(request) {
  try {
    await connectDB()
    
    const token = request.cookies.get('tt_session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET)
    const user = await User.findById(decoded.userId).select('-password -passwordResetToken -emailVerificationToken')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// Update user profile
export async function PUT(request) {
  try {
    console.log('Profile update request received')
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
    const { name, email, phone, profilePicture } = requestBody

    // Validation
    if (!name || name.length < 2 || name.length > 50) {
      console.log('Name validation failed:', name)
      return NextResponse.json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 })
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      console.log('Email validation failed:', email)
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (!phone || !/^(\+254|254|0)[17]\d{8}$/.test(phone)) {
      console.log('Phone validation failed:', phone)
      return NextResponse.json({ error: 'Please enter a valid Kenyan phone number' }, { status: 400 })
    }

    // Check if email or phone already exists (excluding current user)
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: decoded.userId } },
        { $or: [{ email: email.toLowerCase() }, { phone }] }
      ]
    })

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        console.log('Email already exists:', email)
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
      if (existingUser.phone === phone) {
        console.log('Phone already exists:', phone)
        return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 })
      }
    }

    // Update user
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim()
    }

    if (profilePicture) {
      updateData['profile.profilePicture'] = profilePicture
    }

    console.log('Updating user with data:', updateData)

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -emailVerificationToken')

    if (!user) {
      console.log('User not found for ID:', decoded.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Profile updated successfully for user:', decoded.userId)
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user 
    })
  } catch (error) {
    console.error('Profile update error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update profile: ' + error.message }, { status: 500 })
  }
}
