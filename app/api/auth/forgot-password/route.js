import { NextResponse } from 'next/server'
import crypto from 'crypto'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

export async function POST(request) {
  try {
    await connectDB()
    
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json({
        error: 'Email address is required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Please enter a valid email address'
      }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    
    // Always return success for security (don't reveal if email exists)
    if (!user) {
      console.log('❌ Password reset requested for non-existent email:', email)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, password reset instructions have been sent.'
      })
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log('❌ Password reset requested for inactive account:', email)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, password reset instructions have been sent.'
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save reset token to user
    user.passwordResetToken = resetToken
    user.passwordResetExpires = resetTokenExpiry
    await user.save()

    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    
    console.log('🔐 Password reset requested for:', email)
    console.log('🔗 Reset URL (would be sent via email):', resetUrl)
    
    // TODO: Implement email sending service
    // await sendPasswordResetEmail(user.email, user.name, resetUrl)

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions have been sent to your email address.',
      // In development, include the reset URL for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl })
    })

  } catch (error) {
    console.error('❌ Forgot password error:', error)
    return NextResponse.json({
      error: 'Failed to process password reset request. Please try again later.'
    }, { status: 500 })
  }
}
