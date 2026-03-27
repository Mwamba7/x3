import { NextResponse } from 'next/server'
import { getAdminSession } from '../../../../lib/adminAuth'

export async function GET(request) {
  try {
    const session = await getAdminSession()
    
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Return admin profile data
    return NextResponse.json({ 
      success: true,
      user: {
        name: session.username || 'Admin',
        role: 'admin',
        username: session.username,
        loginTime: session.loginTime,
        lastActivity: session.lastActivity
      }
    })
    
  } catch (error) {
    console.error('Admin profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
