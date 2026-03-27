import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test basic response without database
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: 'API Health Check',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
