import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSession } from '../../../../lib/adminAuth'

export async function POST(request) {
  try {
    const session = await getAdminSession()
    
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Update last activity time is handled in getAdminSession
    return NextResponse.json({ 
      success: true, 
      message: 'Activity updated' 
    })
    
  } catch (error) {
    console.error('Activity update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
