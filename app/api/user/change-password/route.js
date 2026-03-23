import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../../../../models/User'
import connectDB from '../../../../lib/mongodb'

export async function POST(request) {
  try {
    await connectDB()
    
    const token = request.cookies.get('tt_session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.SESSION_SECRET)
    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 })
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    
    const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
    
    if (strengthScore < 3) {
      return NextResponse.json({ 
        error: 'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, special characters' 
      }, { status: 400 })
    }

    // Get user and verify current password
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password and update
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    await User.findByIdAndUpdate(decoded.userId, {
      password: hashedNewPassword,
      loginAttempts: 0, // Reset login attempts on password change
      lockUntil: undefined // Remove any account locks
    })

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
