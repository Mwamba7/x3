import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    // Clear admin session cookie
    const cookieStore = cookies()
    cookieStore.delete('admin_session')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin logout successful' 
    })
    
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
