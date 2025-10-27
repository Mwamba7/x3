import jwt from 'jsonwebtoken'
import User from '../models/User'
import connectDB from './mongodb'

export async function verifyAuth(request) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return { authenticated: false, error: 'No token provided' }
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret')
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password')
    if (!user || !user.isActive) {
      return { authenticated: false, error: 'User not found or inactive' }
    }

    return { 
      authenticated: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile
      }
    }

  } catch (error) {
    console.error('❌ Auth verification error:', error)
    return { authenticated: false, error: 'Invalid token' }
  }
}

export function requireAuth(handler) {
  return async (request, context) => {
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        details: authResult.error
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add user to request context
    request.user = authResult.user
    
    return handler(request, context)
  }
}

export function requireAdmin(handler) {
  return async (request, context) => {
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return new Response(JSON.stringify({
        error: 'Authentication required',
        details: authResult.error
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (authResult.user.role !== 'admin') {
      return new Response(JSON.stringify({
        error: 'Admin access required'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add user to request context
    request.user = authResult.user
    
    return handler(request, context)
  }
}
