import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

export async function GET(request) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('tt_session')?.value
    
    if (!token) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret')
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password')
    if (!user || !user.isActive) {
      return NextResponse.json({
        error: 'User not found or inactive'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    })

  } catch (error) {
    console.error('❌ Auth check error:', error)
    return NextResponse.json({
      error: 'Invalid token'
    }, { status: 401 })
  }
}
