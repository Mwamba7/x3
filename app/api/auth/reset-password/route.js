import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

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

export async function POST(request) {
  try {
    await connectDB()
    
    const { token, password } = await request.json()

    // Validation
    if (!token || !password) {
      return NextResponse.json({
        error: 'Reset token and new password are required'
      }, { status: 400 })
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.isStrong) {
      return NextResponse.json({
        error: passwordCheck.feedback
      }, { status: 400 })
    }

    // Find user by reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() } // Token must not be expired
    })

    if (!user) {
      return NextResponse.json({
        error: 'Invalid or expired reset token. Please request a new password reset.'
      }, { status: 400 })
    }

    // Check if user account is active
    if (!user.isActive) {
      return NextResponse.json({
        error: 'Account is deactivated. Please contact support.'
      }, { status: 401 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user password and clear reset token
    user.password = hashedPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    user.loginAttempts = 0 // Reset login attempts
    user.lockUntil = undefined // Clear any account locks
    user.lastLogin = new Date() // Update last login time
    
    await user.save()

    console.log('✅ Password reset successful for user:', user.email)

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.'
    })

  } catch (error) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json({
      error: 'Failed to reset password. Please try again later.'
    }, { status: 500 })
  }
}
