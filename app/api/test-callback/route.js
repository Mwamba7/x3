import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Callback test endpoint is reachable',
    timestamp: new Date().toISOString(),
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/test-callback`,
    callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`
  })
}

export async function POST(request) {
  try {
    const body = await request.json()
    
    console.log('🧪 Test callback received:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({
      message: 'Test callback received successfully',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test callback error:', error)
    return NextResponse.json({
      error: 'Test callback failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
