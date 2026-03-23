import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

// Helper function to normalize phone number
const normalizePhone = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Convert to standard format
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1)
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1)
  }
  
  return cleaned
}

// Helper function to determine if input is email or phone
const isEmail = (input) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(input)
}

export async function POST(request) {
  try {
    await connectDB()
    
    const { emailOrPhone, password, rememberMe = false } = await request.json()

    // Validation
    if (!emailOrPhone || !password) {
      return NextResponse.json({
        error: 'Email/phone and password are required'
      }, { status: 400 })
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters long'
      }, { status: 400 })
    }

    // Determine if input is email or phone and find user
    let user
    if (isEmail(emailOrPhone)) {
      user = await User.findOne({ email: emailOrPhone.toLowerCase() })
    } else {
      const normalizedPhone = normalizePhone(emailOrPhone)
      user = await User.findOne({ phone: normalizedPhone })
    }

    if (!user) {
      return NextResponse.json({
        error: 'Invalid credentials. Please check your email/phone and password.'
      }, { status: 401 })
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60))
      return NextResponse.json({
        error: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`
      }, { status: 423 })
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        error: 'Account is deactivated. Please contact support.'
      }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1
      
      // Lock account after 5 failed attempts for 30 minutes
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        await user.save()
        return NextResponse.json({
          error: 'Too many failed login attempts. Account locked for 30 minutes.'
        }, { status: 423 })
      }
      
      await user.save()
      return NextResponse.json({
        error: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.`
      }, { status: 401 })
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockUntil = undefined
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token with appropriate expiration
    const tokenExpiry = rememberMe ? '30d' : '7d'
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        rememberMe
      },
      process.env.SESSION_SECRET || 'fallback-secret',
      { expiresIn: tokenExpiry }
    )

    // Create response with welcome message
    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        lastLogin: user.lastLogin,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    })

    // Set HTTP-only cookie with appropriate expiration
    const cookieMaxAge = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000 // 30 days
      : 7 * 24 * 60 * 60 * 1000   // 7 days

    response.cookies.set('tt_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge
    })

    // Log successful login
    const loginMethod = isEmail(emailOrPhone) ? 'email' : 'phone'
    console.log(`✅ User logged in successfully via ${loginMethod}:`, user.email, rememberMe ? '(Remember Me)' : '')
    
    return response

  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json({
      error: 'Login failed. Please try again later.'
    }, { status: 500 })
  }
}
