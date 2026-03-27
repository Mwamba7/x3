import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'
import { requireAdmin } from '../../../../lib/adminAuth'

export async function PUT(request) {
  try {
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const { name, email, phone, profilePicture } = await request.json()

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json({
        error: 'Name, email, and phone are required'
      }, { status: 400 })
    }

    // Find and update the admin user
    const updatedUser = await User.findByIdAndUpdate(
      adminUser.userId,
      {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        ...(profilePicture && { 'profile.profilePicture': profilePicture })
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json({
        error: 'Admin user not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profilePicture: updatedUser.profile?.profilePicture
      }
    })

  } catch (error) {
    console.error('❌ Profile update error:', error)
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json({
        error: `${field === 'email' ? 'Email' : 'Phone number'} is already in use`
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Failed to update profile. Please try again.'
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const adminUser = await requireAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const user = await User.findById(adminUser.userId).select('-password')
    
    if (!user) {
      return NextResponse.json({
        error: 'Admin user not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profile?.profilePicture,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    })

  } catch (error) {
    console.error('❌ Profile fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch profile data'
    }, { status: 500 })
  }
}
