import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    // Clear the auth token cookie
    response.cookies.set('tt_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    console.log('✅ User logged out successfully')
    return response

  } catch (error) {
    console.error('❌ Logout error:', error)
    return NextResponse.json({
      error: 'Logout failed'
    }, { status: 500 })
  }
}
