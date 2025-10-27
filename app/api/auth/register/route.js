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

// Helper function to validate password strength
const validatePasswordStrength = (password) => {
  let score = 0
  const feedback = []
  
  if (password.length >= 8) score += 1
  else feedback.push('at least 8 characters')
  
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('lowercase letters')
  
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('uppercase letters')
  
  if (/[0-9]/.test(password)) score += 1
  else feedback.push('numbers')
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  else feedback.push('special characters')
  
  return {
    isStrong: score >= 3,
    score,
    feedback: feedback.length > 0 ? `Password should include: ${feedback.join(', ')}` : 'Strong password'
  }
}

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input.trim().replace(/[<>]/g, '') // Basic XSS prevention
}

export async function POST(request) {
  try {
    await connectDB()
    
    const { name, email, password, phone } = await request.json()

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = sanitizeInput(email)
    const sanitizedPhone = sanitizeInput(phone)

    // Comprehensive validation
    const errors = []

    // Name validation
    if (!sanitizedName) {
      errors.push('Full name is required')
    } else if (sanitizedName.length < 2) {
      errors.push('Name must be at least 2 characters long')
    } else if (sanitizedName.length > 50) {
      errors.push('Name cannot exceed 50 characters')
    }

    // Email validation
    if (!sanitizedEmail) {
      errors.push('Email address is required')
    } else {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      if (!emailRegex.test(sanitizedEmail)) {
        errors.push('Please enter a valid email address')
      }
    }

    // Phone validation
    if (!sanitizedPhone) {
      errors.push('Phone number is required')
    } else {
      const phoneRegex = /^(\+254|254|0)[17]\d{8}$/
      if (!phoneRegex.test(sanitizedPhone)) {
        errors.push('Please enter a valid Kenyan phone number (e.g., 0712345678)')
      }
    }

    // Password validation
    if (!password) {
      errors.push('Password is required')
    } else {
      const passwordCheck = validatePasswordStrength(password)
      if (!passwordCheck.isStrong) {
        errors.push(passwordCheck.feedback)
      }
    }

    // Return validation errors
    if (errors.length > 0) {
      return NextResponse.json({
        error: errors[0] // Return first error for better UX
      }, { status: 400 })
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(sanitizedPhone)

    // Check if user already exists (email or phone)
    const existingUserByEmail = await User.findOne({ email: sanitizedEmail.toLowerCase() })
    if (existingUserByEmail) {
      return NextResponse.json({
        error: 'An account with this email address already exists'
      }, { status: 400 })
    }

    const existingUserByPhone = await User.findOne({ phone: normalizedPhone })
    if (existingUserByPhone) {
      return NextResponse.json({
        error: 'An account with this phone number already exists'
      }, { status: 400 })
    }

    // Hash password with high salt rounds for security
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user with enhanced fields
    const user = new User({
      name: sanitizedName,
      email: sanitizedEmail.toLowerCase(),
      password: hashedPassword,
      phone: normalizedPhone,
      lastLogin: new Date(),
      // Initialize verification tokens (for future email/phone verification)
      isEmailVerified: false,
      isPhoneVerified: false
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      process.env.SESSION_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Create response with welcome message
    const response = NextResponse.json({
      success: true,
      message: `Welcome to Think Twice Resellers, ${user.name}!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt
      }
    })

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    console.log('✅ User registered successfully:', user.email, 'Phone:', user.phone)
    return response

  } catch (error) {
    console.error('❌ Registration error:', error)
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      const message = field === 'email' 
        ? 'An account with this email already exists'
        : 'An account with this phone number already exists'
      
      return NextResponse.json({
        error: message
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Registration failed. Please try again later.'
    }, { status: 500 })
  }
}
