import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb'
import User from '../../../models/User'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await connectDB()
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@supertwiceresellers.com' })
    if (existingAdmin) {
      return NextResponse.json({
        message: 'Admin user already exists',
        email: 'admin@supertwiceresellers.com',
        note: 'Use password: admin123'
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await User.create({
      email: 'admin@supertwiceresellers.com',
      password: hashedPassword,
      role: 'admin'
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      admin: {
        email: adminUser.email,
        password: 'admin123'
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    return NextResponse.json({ 
      error: 'Failed to create admin user', 
      details: error.message,
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    }, { status: 500 })
  }
}
