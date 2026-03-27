import connectDB from '../../../../lib/mongodb'
import User from '../../../../models/User'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    await connectDB()
    
    // Get session token from request
    const sessionToken = request.cookies.get('session-token')?.value
    
    if (!sessionToken) {
      return NextResponse.json({ user: null })
    }
    
    // Verify JWT token
    try {
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret')
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user) {
        return NextResponse.json({ user: null })
      }
      
      return NextResponse.json({ 
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      })
      
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return NextResponse.json({ user: null })
    }
    
  } catch (error) {
    console.error('Error verifying session:', error)
    return NextResponse.json({ user: null })
  }
}
